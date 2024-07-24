import { WebSocketServer } from 'ws';
import crypto from 'node:crypto';

const SERVER_HOST = String(process.env.HOST || '0.0.0.0');
const SERVER_PORT = Number(process.env.PORT || 8080);

const wss = new WebSocketServer({
    host: SERVER_HOST,
    port: SERVER_PORT
});

const games = [];

wss.on('listening', () => console.log(`WebSocket server started on ${SERVER_HOST}:${SERVER_PORT}`));
wss.on('error', console.error);
wss.on('connection', (ws, req) => {
    ws.on('error', console.error);
    console.log(`Connection established from ${req.headers['cf-connecting-ip']}`);
    const id = crypto.randomBytes(2).toString('hex');
    ws.playerId = id;
    ws.inGame = false;
    ws.on('close', () => {
        console.log(`Connection closed from ${req.headers['cf-connecting-ip']}`);
        const game = games.find((game) => game.player1.ws === ws || game.player2.ws === ws);
        if (game) {
            game.player1.ws.inGame = false;
            game.player2.ws.inGame = false;
            game.player1.ws.send(JSON.stringify({ type: 'endGame', reason: 'Opponent disconnected' }));
            game.player2.ws.send(JSON.stringify({ type: 'endGame', reason: 'Opponent disconnected' }));
            games.splice(games.indexOf(game), 1);
        }
    });
    ws.send(JSON.stringify({ type: 'id', id }));
    ws.on('message', (rawData, isBinary) => {
        const message = isBinary ? rawData : rawData.toString();
        const data = JSON.parse(message);
        console.log(data);
        switch (data.type) {
            case 'connect': {
                const clients = Array.from(wss.clients);
                const validIds = clients.filter((client) => !client.inGame).map((client) => client.playerId.toLowerCase());
                if (!validIds.includes(data.id.toLowerCase())) return ws.send(JSON.stringify({ type: 'error', message: 'Invalid player ID' }));
                if (data.id === ws.playerId) return ws.send(JSON.stringify({ type: 'error', message: 'You cannot play with yourself' }));
                const client = clients.find((client) => client.playerId.toLowerCase() === data.id.toLowerCase());
                client.send(JSON.stringify({ type: 'requestConnection', id: ws.playerId }));
                ws.send(JSON.stringify({ type: 'alert', title: 'Sent: ', message: `Connection request sent to ${data.id}` }));
                break;
            }
            case 'acceptConnection': {
                const clients = Array.from(wss.clients);
                const client = clients.find((client) => client.playerId === data.id);
                if (!client) return ws.send(JSON.stringify({ type: 'error', message: 'Invalid player ID' }));
                ws.inGame = true;
                client.inGame = true;
                const game = {
                    player1: {
                        player: 1,
                        ws: ws,
                        id: ws.playerId
                    },
                    player2: {
                        player: 2,
                        ws: client,
                        id: client.playerId
                    },
                    board: [
                        [0, 0, 0],
                        [0, 0, 0],
                        [0, 0, 0]
                    ],
                    currentTurn: 1
                };
                games.push(game);
                ws.send(JSON.stringify({ type: 'startGame', player: 1 }));
                client.send(JSON.stringify({ type: 'startGame', player: 2 }));
                ws.send(
                    JSON.stringify({
                        type: 'update',
                        game: game.board,
                        currentTurn: game.currentTurn
                    })
                );
                client.send(
                    JSON.stringify({
                        type: 'update',
                        game: game.board,
                        currentTurn: game.currentTurn
                    })
                );
                break;
            }
            case 'move': {
                const game = games.find((game) => game.player1.ws === ws || game.player2.ws === ws);
                if (!game) return ws.send(JSON.stringify({ type: 'error', message: 'You are not in a game' }));
                const player = game.player1.ws === ws ? 1 : 2;
                if (game.currentTurn !== player) return ws.send(JSON.stringify({ type: 'alert', title: 'Invalid move: ', message: 'It is not your turn' }));
                const cell = data.cell;
                if (cell < 0 || cell > 8) return ws.send(JSON.stringify({ type: 'alert', title: 'Invalid move: ', message: 'Invalid cell' }));
                const row = Math.floor(cell / 3);
                const col = cell % 3;
                if (game.board[row][col] !== 0) return ws.send(JSON.stringify({ type: 'alert', title: 'Invalid move: ', message: 'Cell already occupied' }));
                game.board[row][col] = player;
                const winner = checkWinner(game.board);
                if (winner === 0) {
                    game.currentTurn = game.currentTurn === 1 ? 2 : 1;
                    game.player1.ws.send(
                        JSON.stringify({
                            type: 'update',
                            game: game.board,
                            currentTurn: game.currentTurn
                        })
                    );
                    game.player2.ws.send(
                        JSON.stringify({
                            type: 'update',
                            game: game.board,
                            currentTurn: game.currentTurn
                        })
                    );
                } else {
                    game.player1.ws.inGame = false;
                    game.player2.ws.inGame = false;
                    game.player1.ws.send(JSON.stringify({ type: 'endGame', reason: winner === 3 ? 'Draw' : `Player ${winner} (${winner === 1 ? 'X' : 'O'}) won` }));
                    game.player2.ws.send(JSON.stringify({ type: 'endGame', reason: winner === 3 ? 'Draw' : `Player ${winner} (${winner === 1 ? 'X' : 'O'}) won` }));
                    games.splice(games.indexOf(game), 1);
                }
            }
        }
    });
});

function checkWinner(board) {
    for (let i = 0; i < 3; i++) {
        if (board[i][0] !== 0 && board[i][0] === board[i][1] && board[i][0] === board[i][2]) return board[i][0];
        if (board[0][i] !== 0 && board[0][i] === board[1][i] && board[0][i] === board[2][i]) return board[0][i];
    }
    if (board[0][0] !== 0 && board[0][0] === board[1][1] && board[0][0] === board[2][2]) return board[0][0];
    if (board[0][2] !== 0 && board[0][2] === board[1][1] && board[0][2] === board[2][0]) return board[0][2];
    if (board.every((row) => row.every((cell) => cell !== 0))) return 3;
    return 0;
}

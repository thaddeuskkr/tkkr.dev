const WEBSOCKET_URL = 'wss://ws.tkkr.dev';
let player = 0;
$(() => {
    const ws = new WebSocket(WEBSOCKET_URL);
    ws.addEventListener('error', console.error);
    ws.addEventListener('open', () => {
        console.log(`Connected to WebSocket server @ ${WEBSOCKET_URL}`);
        $('.websocket-connected').removeClass('hidden');
        $('.websocket-disconnected').addClass('hidden');
    });
    ws.addEventListener('close', () => {
        console.log(`Disconnected from WebSocket server @ ${WEBSOCKET_URL}`);
        $('.websocket-disconnected').removeClass('hidden');
        $('.websocket-connected').addClass('hidden');
        $('.game').addClass('hidden');
    });
    ws.addEventListener('message', (message) => {
        const data = JSON.parse(message.data);
        console.log(data);
        switch (data.type) {
            case 'id': {
                console.log(`Player ID: ${data.id}`);
                $('#playerId').html(`${data.id}`);
                break;
            }
            case 'requestConnection': {
                console.log(`Connection request from ${data.id}`);
                $('#connectionRequests').append(`
                    <a class="connection-request cursor-pointer text-center font-bold text-teal">Connection request from <span class="code rounded-md bg-surface0 px-1 text-teal">${data.id}</span>, click on this message to accept.</a>
                `);
                break;
            }
            case 'startGame': {
                player = data.player;
                $('.pregame').addClass('hidden');
                $('.game').addClass('flex');
                $('.game').removeClass('hidden');
                if (player === 2) sendAlert(`Player ${player}: `, 'Opponent is making the first move');
                break;
            }
            case 'endGame': {
                sendAlert('Game ended: ', data.reason);
                $('.pregame').removeClass('hidden');
                $('.game').addClass('hidden');
                $('.game').removeClass('flex');
                break;
            }
            case 'update': {
                for (let i = 0; i < data.game.length; i++)
                    for (let j = 0; j < data.game[i].length; j++) {
                        if (data.game[i][j] === 1) {
                            $(`.game-cell[data-id="${i * 3 + j}"]`).text('X');
                            $(`.game-cell[data-id="${i * 3 + j}"]`).removeClass('cursor-pointer');
                        } else if (data.game[i][j] === 2) {
                            $(`.game-cell[data-id="${i * 3 + j}"]`).text('O');
                            $(`.game-cell[data-id="${i * 3 + j}"]`).removeClass('cursor-pointer');
                        } else {
                            $(`.game-cell[data-id="${i * 3 + j}"]`).text('');
                            if (data.currentTurn === player) {
                                $(`.game-cell[data-id="${i * 3 + j}"]`).addClass('cursor-pointer');
                                sendAlert(`Player ${player}: `, 'It is your turn to play');
                            } else $(`.game-cell[data-id="${i * 3 + j}"]`).removeClass('cursor-pointer');
                        }
                    }
                break;
            }
            case 'error': {
                sendAlert('Connection failed: ', data.message);
                break;
            }
            case 'alert': {
                sendAlert(data.title, data.message);
                break;
            }
        }
    });

    $('.game-cell').on('click', function () {
        const cell = $(this).data('id');
        ws.send(JSON.stringify({ type: 'move', cell }));
    });

    $(document).on('click', '.connection-request', function () {
        const connectingId = $(this).find('span').text();
        ws.send(JSON.stringify({ type: 'acceptConnection', id: connectingId }));
        $(this).remove();
    });

    $('#connect').on('click', () => {
        ws.send(JSON.stringify({ type: 'connect', id: $('#multiId').val() }));
        $('#multiId').val('');
    });

    function sendAlert(title, data) {
        $('#alert-title').text(title);
        $('#alert-data').text(data);
        $('#alert').removeClass('hidden');
        $('#alert').removeClass('opacity-0');
        $('#alert').addClass('opacity-100');
        // eslint-disable-next-line no-undef
        alertTimeout = setTimeout(() => {
            $('#alert').removeClass('opacity-100');
            $('#alert').addClass('opacity-0');
            $('#alert').on('transitionend', () => {
                $('#alert').addClass('hidden');
                // eslint-disable-next-line no-undef
                clearTimeout(alertTimeout);
            });
        }, 2000);
    }
});

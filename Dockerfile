FROM node:lts-alpine AS base
WORKDIR /server
COPY package.json package-lock.json .
COPY server.js .
RUN npm install --omit=dev

CMD [ "node", "server.js" ]
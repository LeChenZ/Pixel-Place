
const express = require('express');
const WebSocket = require('ws');
const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

let grid = Array(100).fill().map(() => Array(100).fill('#FFFFFF'));
const cooldowns = {};

app.use(express.static('.'));

function getUserId(req) {
  return req.socket.remoteAddress;
}

wss.on('connection', (ws, req) => {
    const userId = getUserId(req);

    console.log(`New client connected: ${userId}`);

    ws.send(JSON.stringify({ type: 'grid', grid }));

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'place_pixel') {
            const { x, y, color } = data;

            const now = Date.now();

            if (cooldowns[userId] && (now - cooldowns[userId]) < 60000) {
                const timeLeft = Math.ceil((60000 - (now - cooldowns[userId])) / 1000);
                ws.send(JSON.stringify({ type: 'error', message: `Veuillez attendre encore ${timeLeft} secondes avant de placer un autre pixel.` }));
            } else {
                
                cooldowns[userId] = now;

                grid[x][y] = color;
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'update_pixel', x, y, color }));
                    }
                });
            }
        }
    });
});

server.listen(3000, () => {
    console.log('Server listening on port 3000');
});

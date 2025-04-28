const WebSocket = require('ws');

let wss;
const clients = new Set();

const initialize = (server) => {
    wss = new WebSocket.Server({ server });
    
    wss.on('connection', (ws) => {
        console.log('Client connected');
        clients.add(ws);
        
        ws.on('close', () => {
            console.log('Client disconnected');
            clients.delete(ws);
        });
        
        ws.on('message', (message) => {
            console.log('Received message:', message);
        });
    });
    
    console.log('WebSocket server initialized');
    return wss;
};

const broadcast = (data) => {
    if (!wss) {
        console.warn('WebSocket server not initialized');
        return;
    }
    
    const message = JSON.stringify(data);
    
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
};

module.exports = {
    initialize,
    broadcast
};
const WebSocket = require('ws');

class WebSocketService {
    constructor() {
        this.wss = null;
        this.clients = new Set();
    }

    initialize(server) {
        this.wss = new WebSocket.Server({ server });
        
        this.wss.on('connection', (ws) => {
            console.log('Client connected to WebSocket');
            this.clients.add(ws);
            
            ws.on('close', () => {
                console.log('Client disconnected from WebSocket');
                this.clients.delete(ws);
            });
            
            // Send initial message
            ws.send(JSON.stringify({ type: 'connection', message: 'Connected to BookStore WebSocket server' }));
        });
    }

    broadcast(data) {
        // Broadcast to all connected clients
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    }
}

// Singleton instance
const websocketService = new WebSocketService();
module.exports = websocketService;

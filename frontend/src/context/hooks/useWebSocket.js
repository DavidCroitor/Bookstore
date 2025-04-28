import { useState, useEffect, useRef, useCallback } from 'react';
import { WS_URL } from '../constants';

export const useWebSocket = (handlers) => {
    const { onOpen, onClose, onError, onNewBook, onUpdateBook, onDeleteBook } = handlers || {};
    const [socket, setSocket] = useState(null);
    const reconnectAttemptRef = useRef(0);
    const maxReconnectAttempts = 5; 
    
    useEffect(() => {
        if (!WS_URL) return; // Don't connect if URL is not provided

        const connect = () => {
            console.log(`Attempting WebSocket connection (Attempt: ${reconnectAttemptRef.current + 1})...`);
            const ws = new WebSocket(WS_URL);

            ws.onopen = () => {
                console.log('WebSocket Connected');
                setSocket(ws);
                reconnectAttemptRef.current = 0; // Reset attempts on successful connection
                if (onOpen) onOpen();
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    console.log('WebSocket message received:', message);
                    switch (message.type) {
                        case 'new_book':
                            if (onNewBook) onNewBook(message.data);
                            break;
                        case 'update_book':
                            if (onUpdateBook) onUpdateBook(message.data);
                            break;
                        case 'delete_book':
                            if (onDeleteBook) onDeleteBook(message.data);
                            break;
                        default:
                            console.warn('Unknown WebSocket message type:', message.type);
                    }
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket Error:', error);
                if (onError) onError(error);
            };

            ws.onclose = (event) => {
                console.log(`WebSocket Disconnected: Code=${event.code}, Reason=${event.reason}`);
                setSocket(null);
                if (onClose) onClose();

                if (reconnectAttemptRef.current < maxReconnectAttempts) {
                    const timeout = Math.pow(2, reconnectAttemptRef.current) * 1000;
                    console.log(`Attempting to reconnect in ${timeout / 1000}s...`);
                    setTimeout(connect, timeout);
                    reconnectAttemptRef.current++;
                } else {
                    console.error('WebSocket reconnect attempts exhausted.');
                }
            };
        };

        connect();

        // Cleanup function
        return () => {
            reconnectAttemptRef.current = maxReconnectAttempts; 
            if (socket) {
                console.log('Closing WebSocket connection.');
                socket.close();
            }
        };
    }, [WS_URL]);

    const sendMessage = useCallback((message) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message));
        } else {
            console.error('Cannot send message: WebSocket is not open.');
        }
    }, [socket]);


    return { socket, sendMessage }; 
};
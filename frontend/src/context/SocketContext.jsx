import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './authContext';
import { toast } from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionErrors, setConnectionErrors] = useState(0);
    const auth = useAuth();
    const user = auth?.user;

    useEffect(() => {
        // Clear any previous socket
        if (socket) {
            socket.close();
            setSocket(null);
        }

        // Only attempt to connect if we have a user
        if (user) {
            console.log('Initializing socket connection with user:', user.id || user._id);
            
            // Determine server URL - prefer secure connection
            const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
            console.log('Connecting to socket server at:', serverUrl);
            
            try {
                const newSocket = io(serverUrl, {
                    withCredentials: true,
                    autoConnect: true,
                    reconnectionAttempts: 3,
                    reconnectionDelay: 1000,
                    timeout: 5000,
                    auth: {
                        userId: user.id || user._id,
                        token: localStorage.getItem('token')
                    },
                    transports: ['websocket', 'polling']
                });

                newSocket.on('connect', () => {
                    console.log('Connected to WebSocket server successfully');
                    setIsConnected(true);
                    setConnectionErrors(0);
                    
                    // Join prison-specific room if user is a warden
                    if (user.role === 'warden' && user.prisonId) {
                        newSocket.emit('join-prison-room', user.prisonId);
                    }
                });

                newSocket.on('connect_error', (err) => {
                    console.error('Socket connection error:', err.message);
                    setConnectionErrors(prev => prev + 1);
                    
                    // After 3 failed attempts, don't keep trying
                    if (connectionErrors >= 2) {
                        console.log('Maximum socket connection attempts reached, stopping reconnect');
                        newSocket.disconnect();
                        // Let the user know we're falling back to standard mode
                        console.log('Falling back to API-only mode');
                    }
                });

                newSocket.on('disconnect', (reason) => {
                    console.log(`Disconnected from WebSocket server: ${reason}`);
                    setIsConnected(false);
                    
                    if (reason === 'io server disconnect') {
                        // The server has forcefully disconnected the socket
                        console.log('Server forcefully disconnected, not attempting reconnect');
                    }
                });

                setSocket(newSocket);

                return () => {
                    console.log('Cleaning up socket connection');
                    newSocket.close();
                };
            } catch (error) {
                console.error('Failed to initialize socket:', error);
            }
        } else {
            console.log('No user available, skipping socket connection');
            setSocket(null);
            setIsConnected(false);
        }
    }, [user, connectionErrors]);

    const value = {
        socket,
        isConnected
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
}; 
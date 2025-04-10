const socketIO = require('socket.io');

let io;

const initializeSocket = (server) => {
    io = socketIO(server, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // Handle joining specific rooms (e.g., for prison-specific notifications)
        socket.on('join-prison-room', (prisonId) => {
            socket.join(`prison-${prisonId}`);
            console.log(`Client ${socket.id} joined prison room: ${prisonId}`);
        });

        // Handle messaging events
        socket.on('send-message', async (data) => {
            try {
                // Broadcast the message to the receiver
                io.to(data.receiverId).emit('new-message', {
                    ...data,
                    _id: Date.now().toString(), // Temporary ID until saved to database
                    createdAt: new Date().toISOString(),
                    status: 'sent'
                });

                // Save message to database (implement your database logic here)
                // const savedMessage = await Message.create(data);
                
                // Emit the saved message with database ID
                // io.to(data.receiverId).emit('new-message', savedMessage);
            } catch (error) {
                console.error('Error handling message:', error);
            }
        });

        // Handle typing indicators
        socket.on('typing', (data) => {
            io.to(data.receiverId).emit('typing', {
                userId: socket.id,
                isTyping: data.isTyping
            });
        });

        // Handle user status updates
        socket.on('user-status', (status) => {
            io.emit('user-status', {
                userId: socket.id,
                status
            });
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
            // Emit offline status
            io.emit('user-status', {
                userId: socket.id,
                status: 'offline'
            });
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

module.exports = {
    initializeSocket,
    getIO
}; 
import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import messageRoutes from './routes/messages';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/messages', messageRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Socket.io messaging server is running');
});

// Connect to MongoDB (if needed)
// mongoose.connect(process.env.MONGODB_URI)
//   .then(() => console.log('Connected to MongoDB'))
//   .catch(err => console.error('MongoDB connection error:', err));

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Handle authentication - store user info in socket object
  socket.on('auth', (userData) => {
    console.log('User authenticated:', userData.userId);
    socket.userId = userData.userId;
    socket.userName = userData.userName;
    
    // Join user's own room for direct messages
    socket.join(userData.userId);
    
    // Broadcast online status
    io.emit('userStatus', {
      userId: userData.userId,
      status: 'online'
    });
  });

  // Handle sending messages
  socket.on('sendMessage', (messageData) => {
    console.log('Message received:', messageData);
    
    // Emit to receiver's room
    if (messageData.receiverId) {
      io.to(messageData.receiverId).emit('newMessage', {
        ...messageData,
        _id: `temp-${Date.now()}`,
        createdAt: new Date().toISOString()
      });
      
      console.log(`Message sent to receiver ${messageData.receiverId}`);
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    if (data.receiverId) {
      io.to(data.receiverId).emit('typing', {
        userId: socket.userId,
        isTyping: data.isTyping
      });
    }
  });

  // Handle user status updates
  socket.on('userStatus', (status) => {
    io.emit('userStatus', {
      userId: socket.userId,
      status: status
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (socket.userId) {
      // Emit offline status
      io.emit('userStatus', {
        userId: socket.userId,
        status: 'offline'
      });
    }
  });
});

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
}); 
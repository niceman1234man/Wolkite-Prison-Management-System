import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import http from "http"; // Add http server
import { Server } from "socket.io"; // Add Socket.io

// Import database connection
import { connectDb } from "./config/db.js";

// Import routes
import { userRouter } from "./router/user.router.js";
import { visitorRouter } from "./router/visitor.router.js";
// import {Schedulerouter} from './router/visitorSchedule.router.js'
import { incidentRouter } from "./router/incident.router.js";
import { inmateRouter } from "./router/inmate.router.js";
import { prisonRouter } from "./router/prison.router.js";
import { paroleRouter } from "./router/parole.router.js";
import { clearanceRoutes } from "./router/clearance.router.js";
import { noticeRouter } from "./router/notice.router.js";
import { instructionRouter } from "./router/instruction.router.js";
import { transferRouter } from "./router/transfer.router.js";
import { MessageRoutes } from "./router/hompage.router.js";
import reportRoutes from "./router/reportRouter.js";
import prisonerRoutes from "./router/prisonerRouter.js";
import transferRoutes from "./router/transferRouter.js";
import woredaInmateRouter from "./router/woredaInmate.router.js";
import { notificationRouter } from "./router/notification.router.js";
import woredaRouter from "./router/woreda.router.js";
import dashboardRouter from "./router/dashboard.router.js";
import { checkCustodyAlerts } from "./controller/notification.controller.js";
import visitorAccountRouter from "./router/visitorAccount.router.js";
import visitorScheduleRouter from "./router/visitorSchedule.router.js";
import messageRoutes from "./routes/messageRoutes.js";
import { EventEmitter } from 'events';
import backupRouter from "./router/backup.js";
import activityLogRouter from "./router/activityLog.router.js";
EventEmitter.defaultMaxListeners = 15; // Increase from default 10

// Load environment variables
dotenv.config();


// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://10.194.120.26:5173","0.0.0.0"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "http://10.194.120.26:5173"],
    credentials: true,
  })
);

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use('/api/backup', backupRouter);
app.use('/api/activity', activityLogRouter);
app.use("/api/user", userRouter);
app.use("/api/visitor", visitorRouter);
app.use("/api/incidents", incidentRouter);
app.use("/api/inmates", inmateRouter);
app.use("/api/prison", prisonRouter);
app.use("/api/parole-tracking", paroleRouter);
app.use("/api/notice", noticeRouter);
app.use("/api/instruction", instructionRouter);
app.use("/api/transfer", transferRouter);
app.use("/api/clearance", clearanceRoutes);
app.use("/api/managemessages", MessageRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/prisoners", prisonerRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/woreda-inmate", woredaInmateRouter);
app.use("/api/notification", notificationRouter);
app.use("/api/woreda", woredaRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/auth", visitorAccountRouter);
app.use("/api/visitor/schedule", visitorScheduleRouter);
app.use("/api/messages", messageRoutes);

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Handle authentication - store user info in socket object
  socket.on('auth', (userData) => {
    console.log('User authenticated:', userData);
    if (userData && userData.userId) {
      socket.userId = userData.userId;
      socket.join(userData.userId);
      io.emit('userStatus', {
        userId: userData.userId,
        status: 'online'
      });
    }
  });

  // Handle sending messages
  socket.on('sendMessage', (message) => {
    console.log('Message received:', message);
    if (message && message.receiverId) {
      io.to(message.receiverId).emit('newMessage', {
        ...message,
        _id: `temp-${Date.now()}`,
        createdAt: new Date().toISOString()
      });
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    if (data && data.receiverId) {
      io.to(data.receiverId).emit('typing', {
        userId: socket.userId,
        isTyping: data.isTyping
      });
    }
  });

  // Handle user status updates
  socket.on('userStatus', (status) => {
    if (socket.userId) {
      io.emit('userStatus', {
        userId: socket.userId,
        status: status
      });
    }
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

// Connect to database 
mongoose
.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    // Start periodic custody alert check (every hour)
    setInterval(checkCustodyAlerts, 60 * 60 * 1000);
    // Run initial check
    checkCustodyAlerts();
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Socket.io server initialized on the same port`);
});

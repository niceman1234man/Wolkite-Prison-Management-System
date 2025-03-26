import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

// Import database connection
import { connectDb } from "./config/db.js";

// Import routes
import { userRouter } from "./router/user.router.js";
import { visitorRouter } from "./router/visitor.router.js";
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
import { woredaInmateRouter } from "./router/woredaInmate.router.js";
import { notificationRouter } from "./router/notification.router.js";
import { checkCustodyAlerts } from "./controller/notification.controller.js";

// Load environment variables
dotenv.config();

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/user", userRouter);
app.use("/visitor", visitorRouter);
app.use("/incidents", incidentRouter);
app.use("/inmates", inmateRouter);
app.use("/api/prison", prisonRouter);
app.use("/parole-tracking", paroleRouter);
app.use("/notice", noticeRouter);
app.use("/instruction", instructionRouter);
app.use("/transfer", transferRouter);
app.use("/clearance", clearanceRoutes);
app.use("/managemessages", MessageRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/prisoners", prisonerRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/woreda-inmate", woredaInmateRouter);
app.use("/api/notification", notificationRouter);

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
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

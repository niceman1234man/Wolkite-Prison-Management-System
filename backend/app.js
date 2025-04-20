import express from "express";
import cors from "cors";
import reportsRouter from "./router/reports.router.js";
import { transferRouter } from "./router/transfer.router.js";
import visitorAccountRouter from "./router/visitorAccount.router.js";
import visitorScheduleRouter from "./router/visitorSchedule.router.js";
import backupRoutes from './router/backup.js';
import { inmateRouter } from './router/inmate.router.js';
const app = express();

// Middleware
app.use(cors());
app.use(express.json());


// ... other middleware and setup ...

// Use the backup routes

// Routes
app.use("/api/reports", reportsRouter);
app.use("/api/transfer", transferRouter);
app.use("/api/prisoner", inmateRouter);
app.use("/api/auth", visitorAccountRouter);
app.use("/api/visitorSchedule", visitorScheduleRouter);

export default app;

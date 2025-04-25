import express from "express";
import cors from "cors";
import reportsRouter from "./router/reports.router.js";
import transferRouter from "./router/transferRouter.js";
import visitorRouter from "./router/visitor.router.js";
import visitorAccountRouter from "./router/visitorAccount.router.js";
import visitorScheduleRouter from "./router/visitorSchedule.router.js";
import backupRoutes from './router/backup.js';
import translationRouter from './router/translation.router.js';

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
app.use("/api/translate", translationRouter);

export default app;

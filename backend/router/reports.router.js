import express from "express";
import {
  getDailyIntake,
  getTransferStats,
} from "../controller/reports.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get daily intake data
router.get("/daily-intake", getDailyIntake);

// Get transfer statistics
router.get("/transfer-stats", getTransferStats);

export default router;

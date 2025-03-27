import express from "express";
import { getDashboardData } from "../controller/dashboard.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get dashboard data
router.get("/data", getDashboardData);

export default router; 
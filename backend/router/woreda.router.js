import express from "express";
import { getWoredaStats } from "../controller/woredaController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get woreda statistics
router.get("/stats", getWoredaStats);

export default router; 
import express from "express";
import { createVisitSchedule, getVisitorSchedules, getSchedule, cancelSchedule, updateScheduleNotes } from "../controller/visitorSchedule.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Schedule management routes
router.post("/schedule", createVisitSchedule);
router.get("/schedules", getVisitorSchedules);
router.get("/schedule/:id", getSchedule);
router.put("/schedule/:id/cancel", cancelSchedule);
router.put("/schedule/:id/notes", updateScheduleNotes);

export default router; 
import express from "express";
// import { createVisitSchedule, getVisitorSchedules, updateVisitSchedule, deleteVisitSchedule } from "../controller/visitorSchedule.controller.js";
import { 
  createSchedule, 
  getVisitorSchedules, 
  getSchedule, 
  cancelSchedule, 
  updateScheduleNotes, 
  updateSchedule,
  approveSchedule,
  rejectSchedule,
  postponeSchedule,
  getVisitorCapacity,
  updateVisitorCapacity
} from "../controller/visitorSchedule.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import multer from "multer";
import path from "path";
import { getAllInmates } from "../controller/inmate.controller.js";
import VisitorSchedule from "../model/visitorSchedule.model.js";
import mongoose from "mongoose";

const visitorScheduleRouter = express.Router();

// Configure multer for multiple file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/visitor-photos');
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Apply authentication middleware to all routes
visitorScheduleRouter.use(authenticateToken);

// Routes
visitorScheduleRouter.get("/inmates", getAllInmates);
visitorScheduleRouter.post("/schedule", upload.fields([
  { name: 'visitorPhoto', maxCount: 1 },
  { name: 'idPhoto', maxCount: 1 }
]), createSchedule);
visitorScheduleRouter.get("/schedules", getVisitorSchedules);
visitorScheduleRouter.get("/schedule/:id", getSchedule);
visitorScheduleRouter.put("/schedule/:id", upload.fields([
  { name: 'visitorPhoto', maxCount: 1 },
  { name: 'idPhoto', maxCount: 1 }
]), updateSchedule);
visitorScheduleRouter.put("/schedule/:id/cancel", cancelSchedule);
visitorScheduleRouter.put("/schedule/:id/notes", updateScheduleNotes);

// Add routes for police officer actions
visitorScheduleRouter.put("/schedule/:id/approve", approveSchedule);
visitorScheduleRouter.put("/schedule/:id/reject", rejectSchedule);
visitorScheduleRouter.put("/schedule/:id/postpone", postponeSchedule);

// Visitor capacity management routes
visitorScheduleRouter.get("/capacity", getVisitorCapacity);
visitorScheduleRouter.put("/capacity", updateVisitorCapacity);

// Check if user has pending schedules
visitorScheduleRouter.get("/check-pending", async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId || userId === 'undefined' || userId === 'null') {
      // Instead of error, just return false for hasPendingSchedule
      return res.status(200).json({
        success: true,
        hasPendingSchedule: false,
        message: "No valid userId provided, assuming no pending schedules"
      });
    }
    
    // Verify userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(200).json({
        success: true,
        hasPendingSchedule: false,
        message: "Invalid userId format, assuming no pending schedules"
      });
    }
    
    const pendingSchedule = await VisitorSchedule.findOne({
      userId,
      status: { $in: ["Pending", "pending"] }
    });
    
    res.status(200).json({
      success: true,
      hasPendingSchedule: !!pendingSchedule
    });
  } catch (error) {
    console.error("Error checking pending schedules:", error);
    // Instead of 500 error, return a safe fallback response
    res.status(200).json({
      success: true,
      hasPendingSchedule: false,
      message: "Error checking pending schedules, assuming none exist",
      error: error.message
    });
  }
});

// Get daily visitor counts for capacity planning
visitorScheduleRouter.get("/daily-visits", async (req, res) => {
  try {
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get date 30 days from now
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 30);
    
    // Find all approved or pending schedules in the date range
    const schedules = await VisitorSchedule.find({
      visitDate: { $gte: today, $lte: endDate },
      status: { $in: ["Approved", "Pending"] }
    }).select('visitDate status');
    
    // Organize counts by date
    const dailyVisits = {};
    
    schedules.forEach(schedule => {
      // Format date as YYYY-MM-DD
      const dateStr = new Date(schedule.visitDate).toISOString().split('T')[0];
      
      if (!dailyVisits[dateStr]) {
        dailyVisits[dateStr] = 0;
      }
      
      // Only count approved schedules towards capacity
      if (schedule.status === "Approved") {
        dailyVisits[dateStr] += 1;
      }
    });
    
    res.status(200).json({
      success: true,
      dailyVisits
    });
  } catch (error) {
    console.error("Error fetching daily visits:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch daily visits",
      error: error.message
    });
  }
});

export default visitorScheduleRouter; 
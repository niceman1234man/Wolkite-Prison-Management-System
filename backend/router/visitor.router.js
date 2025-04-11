import express from 'express'
import { authenticateToken } from '../utilities.js';
import { allVisitors, deleteVisitor, getVisitor, updateVisitor, visitorInformation } from '../controller/visitor.controller.js';
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
  updateVisitorCapacity,
  deleteVisitorSchedule
} from "../controller/visitorSchedule.controller.js";
import multer from "multer";
import path from "path";
import { getAllInmates } from "../controller/inmate.controller.js";
import VisitorSchedule from "../model/visitorSchedule.model.js";
import mongoose from "mongoose";

export const visitorRouter=express.Router();

// Configure multer for file uploads
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

// Original visitor routes
visitorRouter.post('/new-visitor',authenticateToken,visitorInformation);
visitorRouter.get('/allVisitors',authenticateToken,allVisitors);
visitorRouter.get('/get-Visitor/:id',authenticateToken,getVisitor);
visitorRouter.put('/update-Visitor/:id',authenticateToken,updateVisitor);
visitorRouter.delete('/delete-Visitor/:id',authenticateToken,deleteVisitor);

// Add new visitor schedule routes
visitorRouter.get("/schedule/inmates", getAllInmates);
visitorRouter.post("/schedule", upload.fields([
  { name: 'visitorPhoto', maxCount: 1 },
  { name: 'idPhoto', maxCount: 1 }
]), createSchedule);
visitorRouter.get("/schedule/schedules", getVisitorSchedules);
visitorRouter.get("/schedule/:id", authenticateToken, getSchedule);
visitorRouter.put("/schedule/:id", authenticateToken, upload.fields([
  { name: 'visitorPhoto', maxCount: 1 },
  { name: 'idPhoto', maxCount: 1 }
]), updateSchedule);
visitorRouter.put("/schedule/:id/cancel", cancelSchedule);
visitorRouter.put("/schedule/:id/notes", authenticateToken, updateScheduleNotes);

// Add routes for police officer actions
visitorRouter.put("/schedule/:id/approve", authenticateToken, approveSchedule);
visitorRouter.put("/schedule/:id/reject", authenticateToken, rejectSchedule);
visitorRouter.put("/schedule/:id/postpone", authenticateToken, postponeSchedule);

// Visitor capacity management routes
visitorRouter.get("/schedule/capacity", getVisitorCapacity);
visitorRouter.put("/schedule/capacity", authenticateToken, updateVisitorCapacity);

// Check if user has pending schedules
visitorRouter.get("/schedule/check-pending", async (req, res) => {
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
visitorRouter.get("/schedule/daily-visits", async (req, res) => {
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

// Delete visitor schedule
visitorRouter.delete("/schedule/:id", authenticateToken, deleteVisitorSchedule);
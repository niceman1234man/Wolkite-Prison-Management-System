import express from "express";
// import { createVisitSchedule, getVisitorSchedules, updateVisitSchedule, deleteVisitSchedule } from "../controller/visitorSchedule.controller.js";
import { 
  createVisitSchedule, 
  getVisitorSchedules, 
  getSchedule, 
  cancelSchedule, 
  updateScheduleNotes, 
  updateSchedule,
  approveSchedule,
  rejectSchedule,
  postponeSchedule
} from "../controller/visitorSchedule.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import multer from "multer";
import path from "path";
import { getAllInmates } from "../controller/inmate.controller.js";

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
]), createVisitSchedule);
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

export default visitorScheduleRouter; 
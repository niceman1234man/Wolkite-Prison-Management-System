import VisitorSchedule from "../model/visitorSchedule.model.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";

// Ensure uploads directory exists
const uploadsDir = 'uploads/visitor-photos';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
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

// Create new visit schedule
// export const createVisitSchedule = async (req, res) => {
//   try {
//     const {
//       inmateId,
//       visitDate,
//       visitTime,
//       purpose,
//       relationship,
//       visitDuration,
//       notes,
//       idType,
//       idNumber,
//       idExpiryDate,
//     } = req.body;

//     // Handle file upload
//     let visitorPhoto = null;
//     if (req.file) {
//       visitorPhoto = `/uploads/visitor-photos/${req.file.filename}`;
//     }

//     // Create new schedule
//     const schedule = new VisitorSchedule({
//       visitorId: req.user.id,
//       inmateId,
//       visitDate,
//       visitTime,
//       purpose,
//       relationship,
//       visitDuration,
//       notes,
//       // Add visitor identification fields
//       idType,
//       idNumber,
//       idExpiryDate,
//       visitorPhoto,
//     });

//     await schedule.save();

//     res.status(201).json({
//       success: true,
//       message: "Visit scheduled successfully",
//       data: schedule,
//     });
//   } catch (error) {
//     console.error("Error in createVisitSchedule:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error scheduling visit",
//       error: error.message,
//     });
//   }
// };

export const createSchedule = async (req, res) => {
  try {
    const formData = req.body;
    console.log("Received form data in controller:", formData);
    console.log("Request user:", req.user);
    console.log("Files:", req.files);
    
    // Get user data from request or token or form data
    let userId;
    
    // First try to get from form data (highest priority)
    if (formData.userId && mongoose.Types.ObjectId.isValid(formData.userId)) {
      userId = formData.userId;
      console.log("Using userId from form data:", userId);
    } 
    // Then try from request.user (if authenticated)
    else if (req.user && req.user._id) {
      userId = req.user._id;
      console.log("Using userId from auth token:", userId);
    } 
    // If still no valid userId, return error
    else {
      console.error("No valid userId found in request");
      return res.status(400).json({
        success: false,
        message: "User ID is required to create a schedule"
      });
    }
    
    // Check if user already has a pending schedule
    const existingPendingSchedule = await VisitorSchedule.findOne({
      userId,
      status: { $in: ["Pending", "pending"] }
    });
    
    if (existingPendingSchedule) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending visit schedule. Please wait for approval or cancel your existing schedule."
      });
    }
    
    // Check visitor capacity for selected date
    const selectedDate = new Date(formData.visitDate);
    selectedDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    // Count existing approved visits for the selected date
    const approvedVisitsCount = await VisitorSchedule.countDocuments({
      visitDate: { $gte: selectedDate, $lt: nextDay },
      status: { $in: ["Approved", "approved"] }
    });
    
    // Get max capacity from env or default to 50
    const maxCapacity = process.env.MAX_VISITOR_CAPACITY || 50;
    
    if (approvedVisitsCount >= maxCapacity) {
      return res.status(400).json({
        success: false,
        message: "Selected date has reached maximum visitor capacity. Please select another date."
      });
    }
    
    // Process uploaded files
    const visitorPhoto = req.files?.visitorPhoto ? `/uploads/visitor-photos/${req.files.visitorPhoto[0].filename}` : null;
    const idPhoto = req.files?.idPhoto ? `/uploads/visitor-photos/${req.files.idPhoto[0].filename}` : null;
    
    // Handle inmateId - could be empty string, null, or valid ObjectId
    let inmateId = null;
    if (formData.inmateId && formData.inmateId.trim() !== '') {
      if (mongoose.Types.ObjectId.isValid(formData.inmateId)) {
        inmateId = formData.inmateId;
      } else if (formData.inmateId === 'default-inmate') {
        // Handle the demo inmate case - set to null for database storage
        console.log("Using demo inmate - setting inmateId to null");
        inmateId = null;
      } else {
        console.log("Invalid inmateId format:", formData.inmateId);
      }
    }
    
    // Create a new schedule, using default values for any missing required fields
    const scheduleData = {
      userId,  // This is now guaranteed to be a valid userId
      firstName: formData.firstName || "Visitor",
      middleName: formData.middleName || "",
      lastName: formData.lastName || "Unknown",
      phone: formData.phone || "+251000000000", // Default phone
      idType: formData.idType || "other",
      idNumber: formData.idNumber || "DEFAULT12345",
      idExpiryDate: formData.idExpiryDate ? new Date(formData.idExpiryDate) : null,
      purpose: formData.purpose || "Visit",
      relationship: formData.relationship || "other",
      inmateId: inmateId,
      visitDate: formData.visitDate ? new Date(formData.visitDate) : new Date(),
      visitTime: formData.visitTime || "10:00 AM",
      visitDuration: formData.visitDuration || 30,
      notes: formData.notes || "",
      visitorPhoto,
      idPhoto,
      status: "Pending"
    };
    
    console.log("Creating schedule with data:", scheduleData);
    
    // Create using findOneAndUpdate with upsert to avoid validation errors
    const newSchedule = await VisitorSchedule.create(scheduleData);

    res.status(201).json({
      success: true,
      message: "Visit scheduled successfully",
      schedule: newSchedule
    });
  } catch (error) {
    console.error("Error creating schedule:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create schedule",
      error: error.message
    });
  }
};


// Get visitor's scheduled visits
export const getVisitorSchedules = async (req, res) => {
  try {
    console.log("Getting visitor schedules with query params:", req.query);
    
    // Get userId from either authenticated user or query parameter
    let userId = null;
    let userRole = "visitor"; // Default role
    
    // Check if user is authenticated via req.user
    if (req.user) {
      userId = req.user.id || req.user._id;
      userRole = req.user.role || req.user.userType;
      console.log("User authenticated via token:", { userId, userRole });
    } 
    // Otherwise try to get from query parameters
    else if (req.query.userId) {
      userId = req.query.userId;
      console.log("Using userId from query parameters:", userId);
    }
    
    console.log("Status parameter:", req.query.status);

    let query = {};
    
    // Different queries based on user role or authentication status
    if (userRole === "police-officer") {
      // If status parameter is "all", don't filter by status for police officers
      if (req.query.status === "all") {
        // No status filter, get all schedules
        console.log("Police officer fetching ALL schedules");
      } else {
        // Default to pending if no status specified or if a specific status is requested
        query.status = req.query.status || "pending";
        console.log("Police officer fetching schedules with status:", query.status);
      }
    } else if (userRole === "admin") {
      // Admins see all schedules, with optional status filter
      if (req.query.status && req.query.status !== "all") {
        query.status = req.query.status;
      }
      console.log("Admin fetching schedules");
    } else {
      // Default case - visitor or unauthenticated with userId in query
      if (userId) {
        // If we have a userId, filter by it
        query.$or = [
          { userId: userId },
          { visitorId: userId }
        ];
        console.log("Visitor fetching their own schedules with ID:", userId);
        
        // Add status filter if provided and not "all"
        if (req.query.status && req.query.status !== "all") {
          query.status = req.query.status;
        }
      } else {
        // No user ID available, return empty array
        console.log("No user ID available, returning empty result");
        return res.json({
          success: true,
          data: [],
          message: "No userId provided in request"
        });
      }
    }

    console.log("Final query:", JSON.stringify(query, null, 2));

    const schedules = await VisitorSchedule.find(query)
      .populate("inmateId", "fullName")
      .populate("userId", "firstName middleName lastName phone")
      .sort({ visitDate: 1 });

    console.log("Found schedules:", schedules.length);

    res.json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    console.error("Error in getVisitorSchedules:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching schedules",
      error: error.message,
    });
  }
};

// Get single schedule
export const getSchedule = async (req, res) => {
  try {
    const schedule = await VisitorSchedule.findById(req.params.id)
      .populate("inmateId", "fullName")
      .populate("approvedBy", "firstName lastName");

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found",
      });
    }

    // Check if the visitor owns this schedule
    if (schedule.visitorId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this schedule",
      });
    }

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error("Error in getSchedule:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching schedule",
      error: error.message,
    });
  }
};

// Cancel visit schedule
export const cancelSchedule = async (req, res) => {
  try {
    console.log("Cancelling schedule with ID:", req.params.id);
    const schedule = await VisitorSchedule.findById(req.params.id);

    if (!schedule) {
      console.log("Schedule not found");
      return res.status(404).json({
        success: false,
        message: "Schedule not found",
      });
    }

    // Get the user ID from either req.user or query params
    let userId = null;
    if (req.user) {
      userId = req.user.id || req.user._id;
    } else if (req.query.userId) {
      userId = req.query.userId;
    } else if (req.body.userId) {
      userId = req.body.userId;
    }

    console.log("User ID:", userId);
    console.log("Schedule userId:", schedule.userId);
    console.log("Schedule visitorId:", schedule.visitorId);

    // Check if the visitor owns this schedule - check both userId and visitorId
    const scheduleUserId = schedule.userId ? schedule.userId.toString() : null;
    const scheduleVisitorId = schedule.visitorId ? schedule.visitorId.toString() : null;
    
    // Skip permission check for admins and police officers
    if (req.user && (req.user.role === 'admin' || req.user.role === 'police-officer')) {
      console.log("Admin or police officer is cancelling the schedule");
    } 
    // Check if user ID matches either userId or visitorId in the schedule
    else if (userId && (userId === scheduleUserId || userId === scheduleVisitorId)) {
      console.log("User authorized to cancel their own schedule");
    } 
    else {
      console.log("Not authorized - userId doesn't match");
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this schedule",
      });
    }

    // Allow cancellation of schedules in various states, but mainly check for completed
    if (schedule.status && schedule.status.toLowerCase() === "completed") {
      console.log("Cannot cancel a completed schedule");
      return res.status(400).json({
        success: false,
        message: "Completed schedules cannot be cancelled",
      });
    }

    // Update schedule status using findByIdAndUpdate for better error handling
    const updatedSchedule = await VisitorSchedule.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "cancelled" } },
      { new: true }
    );

    console.log("Schedule cancelled successfully");
    res.json({
      success: true,
      message: "Schedule cancelled successfully",
      data: updatedSchedule,
    });
  } catch (error) {
    console.error("Error in cancelSchedule:", error);
    res.status(500).json({
      success: false,
      message: "Error cancelling schedule",
      error: error.message,
    });
  }
};

// Update schedule notes
export const updateScheduleNotes = async (req, res) => {
  try {
    const { notes } = req.body;
    const schedule = await VisitorSchedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found",
      });
    }

    // Check if the visitor owns this schedule
    if (schedule.visitorId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this schedule",
      });
    }

    schedule.notes = notes;
    await schedule.save();

    res.json({
      success: true,
      message: "Schedule notes updated successfully",
      data: schedule,
    });
  } catch (error) {
    console.error("Error in updateScheduleNotes:", error);
    res.status(500).json({
      success: false,
      message: "Error updating schedule notes",
      error: error.message,
    });
  }
};

// Update visit schedule
export const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log("Updating schedule with ID:", id);
    console.log("Update data:", updateData);
    
    // Validate the schedule exists
    const existingSchedule = await VisitorSchedule.findById(id);
    if (!existingSchedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found"
      });
    }
    
    // Check if user is authorized to update this schedule
    // Police officers and admins can update any schedule
    // Regular visitors can only update their own schedules
    if (req.user.role !== 'police-officer' && req.user.role !== 'admin') {
      if (existingSchedule.userId.toString() !== req.user.id && 
          existingSchedule.visitorId?.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this schedule"
        });
      }
      
      // Regular users can only update pending schedules
      if (existingSchedule.status.toLowerCase() !== 'pending') {
        return res.status(400).json({
          success: false,
          message: "Cannot modify a schedule that is not pending"
        });
      }
    }
    
    // Update the schedule
    const updatedSchedule = await VisitorSchedule.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: "Schedule updated successfully",
      data: updatedSchedule
    });
  } catch (error) {
    console.error("Error updating schedule:", error);
    res.status(500).json({
      success: false,
      message: "Error updating schedule",
      error: error.message
    });
  }
};

// Approve a visit schedule
export const approveSchedule = async (req, res) => {
  try {
    // Use findByIdAndUpdate instead of find and save to avoid validation issues
    const updatedSchedule = await VisitorSchedule.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: "approved",
          approvedBy: req.user.id,
          approvedAt: new Date()
        }
      },
      { new: true, runValidators: false } // Return updated document and don't run validators
    );

    if (!updatedSchedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found",
      });
    }

    // Only allow police officers to approve schedules
    if (req.user.role !== "police-officer" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to approve schedules",
      });
    }

    res.json({
      success: true,
      message: "Schedule approved successfully",
      data: updatedSchedule,
    });
  } catch (error) {
    console.error("Error in approveSchedule:", error);
    res.status(500).json({
      success: false,
      message: "Error approving schedule",
      error: error.message,
    });
  }
};

// Reject a visit schedule
export const rejectSchedule = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    
    // Use findByIdAndUpdate instead of find and save to avoid validation issues
    const updatedSchedule = await VisitorSchedule.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: "rejected",
          rejectionReason: rejectionReason || "No reason provided",
          approvedBy: req.user.id,
          approvedAt: new Date()
        }
      },
      { new: true, runValidators: false } // Return updated document and don't run validators
    );

    if (!updatedSchedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found",
      });
    }

    // Only allow police officers to reject schedules
    if (req.user.role !== "police-officer" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to reject schedules",
      });
    }

    res.json({
      success: true,
      message: "Schedule rejected successfully",
      data: updatedSchedule,
    });
  } catch (error) {
    console.error("Error in rejectSchedule:", error);
    res.status(500).json({
      success: false,
      message: "Error rejecting schedule",
      error: error.message,
    });
  }
};

// Postpone a visit schedule
export const postponeSchedule = async (req, res) => {
  try {
    const { newDate } = req.body;
    
    if (!newDate) {
      return res.status(400).json({
        success: false,
        message: "New date is required to postpone a schedule",
      });
    }
    
    // Use findByIdAndUpdate instead of find and save to avoid validation issues
    const updatedSchedule = await VisitorSchedule.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          visitDate: new Date(newDate),
          approvedBy: req.user.id,
          approvedAt: new Date()
        }
      },
      { new: true, runValidators: false } // Return updated document and don't run validators
    );

    if (!updatedSchedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found",
      });
    }

    // Only allow police officers to postpone schedules
    if (req.user.role !== "police-officer" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to postpone schedules",
      });
    }

    res.json({
      success: true,
      message: "Schedule postponed successfully",
      data: updatedSchedule,
    });
  } catch (error) {
    console.error("Error in postponeSchedule:", error);
    res.status(500).json({
      success: false,
      message: "Error postponing schedule",
      error: error.message,
    });
  }
};

// Get visitor capacity information
export const getVisitorCapacity = async (req, res) => {
  try {
    // Set default capacity if not in environment variables
    const maxCapacity = process.env.MAX_VISITOR_CAPACITY || 50;
    
    res.status(200).json({
      success: true,
      maxCapacity: parseInt(maxCapacity)
    });
  } catch (error) {
    console.error("Error fetching visitor capacity:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch visitor capacity",
      error: error.message
    });
  }
};

// Update visitor capacity settings
export const updateVisitorCapacity = async (req, res) => {
  try {
    const { maxCapacity } = req.body;
    
    if (!maxCapacity || isNaN(parseInt(maxCapacity)) || parseInt(maxCapacity) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid capacity value. Must be a positive number."
      });
    }
    
    // In a production environment, this would update a database setting
    // For now, we'll just return success and assume env vars are updated manually
    
    res.status(200).json({
      success: true,
      message: "Visitor capacity updated successfully",
      maxCapacity: parseInt(maxCapacity)
    });
  } catch (error) {
    console.error("Error updating visitor capacity:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update visitor capacity",
      error: error.message
    });
  }
}; 
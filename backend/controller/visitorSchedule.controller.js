import VisitorSchedule from "../model/visitorSchedule.model.js";
import multer from "multer";
import path from "path";
import fs from "fs";

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

export const createVisitSchedule = async (req, res) => {
  try {
    console.log("Received body in the backend are :", req.body);
    console.log("Received files:", req.files);

    const {
      inmateId,
      visitDate,
      visitTime,
      purpose,
      relationship,
      visitDuration,
      notes,
      idType,
      idNumber,
      idExpiryDate,
      firstName,
      middleName,
      lastName,
      phone,
    } = req.body;

    // Validate required fields
    if (!visitDate || !visitTime || !purpose || !relationship || !idType || !idNumber || !idExpiryDate || !firstName || !lastName || !phone) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Format phone number
    const formattedPhone = phone.replace(/\D/g, '');
    const finalPhone = formattedPhone.startsWith('0') 
      ? '+251' + formattedPhone.slice(1)
      : formattedPhone.startsWith('251') 
        ? '+' + formattedPhone 
        : '+251' + formattedPhone;

    // Handle file uploads
    let visitorPhoto = null;
    let idPhoto = null;

    if (req.files) {
      if (req.files.visitorPhoto) {
        visitorPhoto = `/uploads/visitor-photos/${req.files.visitorPhoto[0].filename}`;
      }
      if (req.files.idPhoto) {
        idPhoto = `/uploads/visitor-photos/${req.files.idPhoto[0].filename}`;
      }
    }

    // Validate photo uploads
    if (!idPhoto) {
      return res.status(400).json({
        success: false,
        message: "ID photo is required",
      });
    }

    // Create new schedule
    const schedule = new VisitorSchedule({
      visitorId: req.user.id,
      inmateId,
      firstName,
      middleName,
      lastName,
      phone: finalPhone,
      visitDate,
      visitTime,
      purpose,
      relationship,
      visitDuration,
      notes,
      idType,
      idNumber,
      idExpiryDate,
      idPhoto,
      visitorPhoto,
    });

    await schedule.save();

    res.status(201).json({
      success: true,
      message: "Visit scheduled successfully",
      data: schedule,
    });
  } catch (error) {
    console.error("Error in createVisitSchedule:", error);
    res.status(500).json({
      success: false,
      message: "Error scheduling visit",
      error: error.message,
    });
  }
};


// Get visitor's scheduled visits
export const getVisitorSchedules = async (req, res) => {
  try {
    console.log("User role:", req.user.role);
    console.log("User ID:", req.user.id);
    console.log("Status parameter:", req.query.status);

    let query = {};
    
    // Different queries based on user role
    switch (req.user.role) {
      case "police-officer":
        // If status parameter is "all", don't filter by status for police officers
        if (req.query.status === "all") {
          // No status filter, get all schedules
          console.log("Police officer fetching ALL schedules");
        } else {
          // Default to pending if no status specified or if a specific status is requested
          query.status = req.query.status || "pending";
          console.log("Police officer fetching schedules with status:", query.status);
        }
        break;
      case "visitor":
        // Visitors see their own schedules
        query.visitorId = req.user.id;
        
        // Add status filter if provided and not "all"
        if (req.query.status && req.query.status !== "all") {
          query.status = req.query.status;
        }
        break;
      case "admin":
        // Admins see all schedules, with optional status filter
        if (req.query.status && req.query.status !== "all") {
          query.status = req.query.status;
        }
        break;
      default:
        // Default to user's own schedules
        query.visitorId = req.user.id;
        
        // Add status filter if provided and not "all"
        if (req.query.status && req.query.status !== "all") {
          query.status = req.query.status;
        }
    }

    console.log("Final query:", query);

    const schedules = await VisitorSchedule.find(query)
      .populate("inmateId", "fullName")
      .populate("visitorId", "firstName middleName lastName phone")
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
        message: "Not authorized to cancel this schedule",
      });
    }

    // Only allow cancellation of pending schedules
    if (schedule.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending schedules can be cancelled",
      });
    }

    schedule.status = "cancelled";
    await schedule.save();

    res.json({
      success: true,
      message: "Schedule cancelled successfully",
      data: schedule,
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

// Update schedule
export const updateSchedule = async (req, res) => {
  try {
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

    // Only allow updates of pending schedules
    if (schedule.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending schedules can be updated",
      });
    }

    const {
      inmateId,
      visitDate,
      visitTime,
      purpose,
      relationship,
      visitDuration,
      notes,
      idType,
      idNumber,
      idExpiryDate,
      phone,
    } = req.body;

    // Update fields if provided
    if (inmateId && inmateId !== "default_inmate" && inmateId !== "undefined") {
      schedule.inmateId = inmateId;
    } else if (inmateId === "default_inmate") {
      // If default_inmate is explicitly selected, remove the inmateId
      schedule.inmateId = undefined;
    }
    
    if (visitDate) schedule.visitDate = new Date(visitDate);
    if (visitTime) schedule.visitTime = visitTime;
    if (purpose) schedule.purpose = purpose;
    if (relationship) schedule.relationship = relationship;
    if (visitDuration) schedule.visitDuration = parseInt(visitDuration);
    if (notes !== undefined) schedule.notes = notes;
    if (idType) schedule.idType = idType;
    if (idNumber) schedule.idNumber = idNumber;
    if (idExpiryDate) schedule.idExpiryDate = new Date(idExpiryDate);
    if (phone) {
      // Format phone number
      const formattedPhone = phone.replace(/\D/g, '');
      schedule.phone = formattedPhone.startsWith('0') 
        ? '+251' + formattedPhone.slice(1)
        : formattedPhone.startsWith('251') 
          ? '+' + formattedPhone 
          : '+251' + formattedPhone;
    }

    // Handle file upload if new photo is provided
    if (req.file) {
      schedule.visitorPhoto = `/uploads/visitor-photos/${req.file.filename}`;
    }

    await schedule.save();

    res.json({
      success: true,
      message: "Schedule updated successfully",
      data: schedule,
    });
  } catch (error) {
    console.error("Error in updateSchedule:", error);
    res.status(500).json({
      success: false,
      message: "Error updating schedule",
      error: error.message,
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
import VisitorSchedule from "../models/visitorSchedule.model.js";

// Create new visit schedule
export const createVisitSchedule = async (req, res) => {
  try {
    const {
      inmateId,
      visitDate,
      visitTime,
      purpose,
      relationship,
      visitDuration,
      notes,
    } = req.body;

    // Create new schedule
    const schedule = new VisitorSchedule({
      visitorId: req.user.id,
      inmateId,
      visitDate,
      visitTime,
      purpose,
      relationship,
      visitDuration,
      notes,
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
    const schedules = await VisitorSchedule.find({ visitorId: req.user.id })
      .populate("inmateId", "fullName")
      .sort({ visitDate: 1 });

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
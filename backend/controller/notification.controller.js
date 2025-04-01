import { Notification } from "../model/notification.model.js";
import { WoredaInmate } from "../model/woredaInmate.model.js";

// Check for inmates in custody for more than 48 hours
export const checkCustodyAlerts = async () => {
  try {
    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

    const inmates = await WoredaInmate.find({
      intakeDate: { $lte: fortyEightHoursAgo },
      status: "Active",
    });

    for (const inmate of inmates) {
      // Check if notification already exists
      const existingNotification = await Notification.findOne({
        inmateId: inmate._id,
        type: "CUSTODY_ALERT",
      });

      if (!existingNotification) {
        // Create new notification
        await Notification.create({
          inmateId: inmate._id,
          inmateName: `${inmate.firstName} ${inmate.lastName}`,
          type: "CUSTODY_ALERT",
          message: `Inmate ${inmate.firstName} ${inmate.lastName} has been in custody for more than 48 hours.`,
        });
      }
    }
  } catch (error) {
    console.error("Error checking custody alerts:", error);
  }
};

// Get all notifications
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch notifications",
    });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to mark notification as read",
    });
  }
};

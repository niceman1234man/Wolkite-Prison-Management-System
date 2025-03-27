import express from "express";
import {
  getNotifications,
  markNotificationAsRead,
} from "../controller/notification.controller.js";

const router = express.Router();

// Notification routes
router.get("/getall-notifications", getNotifications);
router.put("/mark-read/:id", markNotificationAsRead);

export const notificationRouter = router;

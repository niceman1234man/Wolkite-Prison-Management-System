import express from "express";
import { authenticateToken } from "../utilities.js";
import {
  addNotice,
  getNotice,
  getAllNotices,
  postNotice,
  updateNotice,
  deleteNotice,
  markAsRead,
} from "../controller/notice.controller.js";

export const noticeRouter = express.Router();

// CRUD Routes for Notices
noticeRouter.post("/add-notice", authenticateToken, addNotice);
noticeRouter.get("/getAllNotices", getAllNotices); // Keep without auth for public access
noticeRouter.get("/get-notice/:id", authenticateToken, getNotice);
noticeRouter.put("/update-notice/:id", authenticateToken, updateNotice);
noticeRouter.put("/post-notice/:id", authenticateToken, postNotice);
noticeRouter.delete("/delete-notice/:id", authenticateToken, deleteNotice);

// Route for marking notices as read - keep without auth middleware to support userId in query params
noticeRouter.patch("/mark-as-read/:id", markAsRead);

import express from "express";
import {
  getMessages,
  addMessage,
  updateMessage,
  deleteMessage,
  getSidemMessage,
  uploadMiddleware,
} from "../controller/homepage.controller.js";
import { authenticateToken } from "../utilities.js";

export const MessageRoutes = express.Router();

// Public routes
MessageRoutes.get("/get-messages", getMessages);
MessageRoutes.get("/get-side-images", getSidemMessage);

// Protected routes
MessageRoutes.post("/add-messages", authenticateToken, uploadMiddleware.single("image"), addMessage);
MessageRoutes.put("/update-messages/:id", authenticateToken, uploadMiddleware.single("image"), updateMessage);
MessageRoutes.delete("/delete-messages/:id", authenticateToken, deleteMessage);


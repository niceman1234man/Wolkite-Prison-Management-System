import express from "express";
import {
  registerVisitor,
  loginVisitor,
  getVisitorProfile,
  updateVisitorProfile,
  changePassword,
  logoutVisitor,
  forgotPassword,
  resetPassword
} from "../controller/visitorAccount.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const visitorAccountrouter = express.Router();

// Authentication routes
visitorAccountrouter.post("/register", registerVisitor);
visitorAccountrouter.post("/login", loginVisitor);
visitorAccountrouter.post("/logout", logoutVisitor);
visitorAccountrouter.post("/forgot-password", forgotPassword);
visitorAccountrouter.post("/reset-password/:token", resetPassword);

// Profile routes - protected by auth middleware
visitorAccountrouter.get("/profile", authenticateToken, getVisitorProfile);
visitorAccountrouter.put("/profile", authenticateToken, updateVisitorProfile);
visitorAccountrouter.put("/update-profile", authenticateToken, updateVisitorProfile); // Alias
visitorAccountrouter.put("/change-password", authenticateToken, changePassword);

// Debug route - REMOVE IN PRODUCTION
visitorAccountrouter.get("/sample-users", async (req, res) => {
  try {
    // Only in development
    if (process.env.NODE_ENV !== "production") {
      const { VisitorAccount } = await import("../models/visitorAccount.model.js");
      // Get 5 sample visitor accounts (without password)
      const sampleUsers = await VisitorAccount.find()
        .select("email firstName lastName role")
        .limit(5)
        .lean();
      
      return res.json({ users: sampleUsers });
    }
    return res.status(404).json({ message: "Not found" });
  } catch (error) {
    console.error("Error in sample-users route:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default visitorAccountrouter;
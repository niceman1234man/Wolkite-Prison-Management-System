import express from "express";
import {
  registerVisitor,
  loginVisitor,
  getVisitorProfile,
} from "../controller/visitorAccount.controller.js";
// import { protect } from "../middleware/authMiddleware.js";

const visitorAccountrouter = express.Router();

visitorAccountrouter.post("/register", registerVisitor);
visitorAccountrouter.post("/login", loginVisitor);
// visitorAccountrouter.get("/profile", protect, getVisitorProfile);

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
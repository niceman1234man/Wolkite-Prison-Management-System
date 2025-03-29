import express from "express";
import { registerVisitor, loginVisitor, getVisitorProfile, updateVisitorProfile, changePassword } from "../controller/visitorAccount.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.post("/register", registerVisitor);
router.post("/login", loginVisitor);

// Protected routes
router.get("/profile", authenticateToken, getVisitorProfile);
router.put("/profile", authenticateToken, updateVisitorProfile);
router.put("/change-password", authenticateToken, changePassword);

export default router; 
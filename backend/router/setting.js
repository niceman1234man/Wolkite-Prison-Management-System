
import express from "express";
import { authenticateToken } from "../utilities.js";
// import authMiddleware from "../middleware/authMiddleware.js"; // Optional: Add authentication middleware
import { changePassword } from "../controller/settingController.js";

const router = express.Router();

router.put("/change-password",authenticateToken, changePassword);  
export default router;

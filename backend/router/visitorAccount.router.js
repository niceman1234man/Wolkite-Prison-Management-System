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

export default visitorAccountrouter;
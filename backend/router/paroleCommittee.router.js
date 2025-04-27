import express from "express";
import { getParoleCommitteeMembers, saveParoleCommittee, getPoliceOfficers } from "../controller/paroleCommittee.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const paroleCommitteeRouter = express.Router();

// Get current committee members (accessible to all authenticated users)
paroleCommitteeRouter.get("/members", authenticateToken, getParoleCommitteeMembers);

// Save new committee (restricted to inspectors)
paroleCommitteeRouter.post("/save", authenticateToken, saveParoleCommittee);

// Get all police officers for committee selection
paroleCommitteeRouter.get("/officers", authenticateToken, getPoliceOfficers);

export default paroleCommitteeRouter; 
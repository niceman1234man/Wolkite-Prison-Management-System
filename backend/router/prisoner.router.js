import express from "express";
import multer from "multer";
import { authenticateToken } from "../utilities.js";
import {
  registerPrisoner,
  getAllPrisoners,
  getPrisonerById,
  updatePrisoner,
  deletePrisoner,
} from "../controller/prisoner.controller.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Prisoner routes
router.post("/register", upload.array("documents"), registerPrisoner);
router.get("/getall-inmates", getAllPrisoners);
router.get("/get-inmate/:id", getPrisonerById);
router.put("/update-inmate/:id", updatePrisoner);
router.delete("/delete-inmate/:id", deletePrisoner);

export const prisonerRouter = router;

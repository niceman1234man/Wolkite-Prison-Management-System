import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import {
  registerWoredaInmate,
  getAllWoredaInmates,
  getWoredaInmateById,
  updateWoredaInmate,
  deleteWoredaInmate,
  releaseInmate,
} from "../controller/woredaInmate.controller.js";
import { archiveMiddleware } from "../utils/archiveHelper.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  console.log(`Creating uploads directory: ${uploadDir}`);
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create a safer filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, uniqueSuffix + extension);
  },
});

// Configure multer
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  } 
});

// Woreda inmate routes
router.post("/register", upload.array("documents"), registerWoredaInmate);
router.get("/getall-inmates", getAllWoredaInmates);
router.get("/get-inmate/:id", getWoredaInmateById);
router.put("/update-inmate/:id", upload.array("documents"), updateWoredaInmate);
router.delete("/delete-inmate/:id", authenticateToken, archiveMiddleware("woredaInmate"), deleteWoredaInmate);
router.put("/release-inmate/:id", releaseInmate);

export default router;

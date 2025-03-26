import express from "express";
import multer from "multer";
import {
  registerWoredaInmate,
  getAllWoredaInmates,
  getWoredaInmateById,
  updateWoredaInmate,
  deleteWoredaInmate,
} from "../controller/woredaInmate.controller.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Woreda inmate routes
router.post("/register", upload.array("documents"), registerWoredaInmate);
router.get("/getall-inmates", getAllWoredaInmates);
router.get("/get-inmate/:id", getWoredaInmateById);
router.put("/update-inmate/:id", upload.array("documents"), updateWoredaInmate);
router.delete("/delete-inmate/:id", deleteWoredaInmate);

export const woredaInmateRouter = router;

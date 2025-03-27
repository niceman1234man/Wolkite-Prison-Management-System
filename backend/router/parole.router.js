import express from "express";
import { upload } from "../fileMiddleware.js"; // Ensure this is correctly configured
import {
  addBehaviorLog,
  getParoleRecordById,
  deleteParoleRecord,
  getAllParoleRecords,
} from "../controller/parole.controller.js";

export const paroleRouter = express.Router();

// Route to add behavior logs with file uploads
paroleRouter.post(
  "/add/:inmateId",
  upload.fields([
    { name: "signature1", maxCount: 1 }, // For the first signature
    { name: "signature2", maxCount: 1 }, // For the second signature
    { name: "signature3", maxCount: 1 }, // For the third signature
    { name: "signature4", maxCount: 1 }, // For the fourth signature
    { name: "signature5", maxCount: 1 }, // For the fifth signature
  ]),
  addBehaviorLog
);

paroleRouter.get("/", getAllParoleRecords);
paroleRouter.get("/:inmateId", getParoleRecordById);
paroleRouter.delete("/:inmateId", deleteParoleRecord);


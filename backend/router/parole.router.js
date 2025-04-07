import express from "express";
import { upload } from "../fileMiddleware.js"; // Ensure this is correctly configured
import {
  addBehaviorLog,
  getParoleRecordById,
  deleteParoleRecord,
  getAllParoleRecords,
  paroleRequest,
  updateResponse
} from "../controller/parole.controller.js";

export const paroleRouter = express.Router();

// Route to add behavior logs with file uploads
paroleRouter.post(
  "/add/:inmateId",
  upload.single("signature"),
  addBehaviorLog
);

paroleRouter.get("/", getAllParoleRecords);
paroleRouter.get("/:inmateId", getParoleRecordById);
paroleRouter.put("/request/:inmateId", paroleRequest);
paroleRouter.put("/update/:inmateId", updateResponse);
paroleRouter.delete("/:inmateId", deleteParoleRecord);



// import express from "express";
// import { authenticateToken } from "../utilities.js";
// import { addClearance, deleteClearance, getAllClearance, getClearance, updateClearance } from "../controller/clearance.controller.js";
import express from "express";
import {
  getAllClearances,
  getClearanceById,
  createClearance,
  updateClearance,
  deleteClearance,
} from "../controller/clearance.controller.js";
import { upload } from "../fileMiddleware.js";
import { archiveMiddleware } from "../utils/archiveHelper.js";
import { authenticateToken } from "../utilities.js";
// export const clearanceRouter = express.Router();
// clearanceRouter.post("/add-clearance",upload.single("sign"), authenticateToken, addClearance);
// clearanceRouter.get("/getAllClearance", authenticateToken, getAllClearance);
// clearanceRouter.get("/get-clearance/:id", authenticateToken, getClearance);
// clearanceRouter.put("/update-clearance/:id", authenticateToken, updateClearance);
// // clearanceRouter.put("/delete-clearance/:id", authenticateToken, deleteClearance


export const clearanceRoutes = express.Router();

clearanceRoutes.get("/getAllClearance", authenticateToken, getAllClearances);
clearanceRoutes.get("/getClearance/:id", authenticateToken, getClearanceById);
clearanceRoutes.post("/addClearance", authenticateToken, upload.single("sign"), createClearance);
clearanceRoutes.put("/updateClearance/:id", authenticateToken, upload.single("sign"), updateClearance);
clearanceRoutes.delete("/deleteClearance/:id", authenticateToken, deleteClearance);

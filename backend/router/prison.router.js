import express from "express";
import {
  createPrison,
  getAllPrisons,
  getPrisonById,
  updatePrison,
  deletePrison,
  incrementPrisonPopulation,
  decrementPrisonPopulation
} from "../controller/prison.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create new prison
router.post("/new-prison", createPrison);

// Get all prisons
router.get("/getall-prisons", getAllPrisons);

// Get single prison
router.get("/:id", getPrisonById);

// Update prison
router.put("/:id", updatePrison);

// Delete prison
router.delete("/:id", deletePrison);

// Increment prison population
router.post("/increment-population", incrementPrisonPopulation);

// Decrement prison population
router.post("/decrement-population", decrementPrisonPopulation);

export const prisonRouter = router;

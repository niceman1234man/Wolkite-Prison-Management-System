import express from "express";
import {
  getAllPrisoners,
  getPrisonerById,
  createPrisoner,
  updatePrisoner,
  deletePrisoner,
} from "../controller/prisonerController.js"; // Import prisoner controller functions
import { body } from "express-validator"; // For request validation
import { authenticateToken } from "../utilities.js";
// import { protect, authorize } from "../middleware/authMiddleware.js"; // For authentication and authorization
authenticateToken
const router = express.Router();

// Validation rules for creating/updating a prisoner
const prisonerValidationRules = [
  body("firstName").notEmpty().withMessage("First name is required"),
  body("lastName").notEmpty().withMessage("Last name is required"),
  body("dateOfBirth").isDate().withMessage("Invalid date of birth"),
  body("gender").isIn(["male", "female"]).withMessage("Invalid gender"),
  body("crime").notEmpty().withMessage("Crime is required"),
  body("sentenceStart").isDate().withMessage("Invalid sentence start date"),
  body("sentenceEnd").isDate().withMessage("Invalid sentence end date"),
  body("paroleEligibility").isBoolean().withMessage("Invalid parole eligibility"),
  body("riskLevel").isIn(["Low", "Medium", "High"]).withMessage("Invalid risk level"),
  body("cell").notEmpty().withMessage("Cell ID is required"),
];

// Routes

/**
 * @desc    Get all prisoners
 * @route   GET /api/prisoner/getall-prisoners
 * @access  Private (Admin, Police Officer, Security Staff)
 */
router.get(
  "/getall-prisoners",
  authenticateToken,
  // authorize("admin", "police", "security"),
  getAllPrisoners
);

/**
 * @desc    Get a single prisoner by ID
 * @route   GET /api/prisoner/get-prisoner/:id
 * @access  Private (Admin, Police Officer, Security Staff)
 */
router.get(
  "/get-prisoner/:id",
  authenticateToken,
  // authorize("admin", "police", "security"),
  getPrisonerById
);

/**
 * @desc    Create a new prisoner
 * @route   POST /api/prisoner/new-prisoner
 * @access  Private (Admin, Police Officer)
 * /api/prisoner/new-prisoner
 */
router.post(
  "/new-prisoner",
  authenticateToken,
  // authorize("admin", "police"),
  prisonerValidationRules,
  createPrisoner
);

/**
 * @desc    Update a prisoner by ID
 * @route   PUT /api/prisoner/update-prisoner/:id
 * @access  Private (Admin, Police Officer)
 */
router.put(
  "/update-prisoner/:id",
  authenticateToken,
  // authorize("admin", "police"),
  prisonerValidationRules,
  updatePrisoner
);

/**
 * @desc    Delete a prisoner by ID
 * @route   DELETE /api/prisoner/delete-prisoner/:id
 * @access  Private (Admin)
 */
router.delete(
  "/delete-prisoner/:id",
  authenticateToken,
  // authorize("admin"),
  deletePrisoner
);

export default router;
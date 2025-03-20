import express from "express";
import {
  getAllTransfers,
  getTransferById,
  createTransfer,
  updateTransfer,
  deleteTransfer,
} from "../controller/transferController.js"; // Import transfer controller functions
import { body } from "express-validator"; // For request validation
import { authenticateToken } from "../utilities.js";
// import { protect, authorize } from "../middleware/authMiddleware.js"; // For authentication and authorization

const router = express.Router();

// Validation rules for creating/updating a transfer request
const transferValidationRules = [
  body("prisonerId").notEmpty().withMessage("Prisoner ID is required"),
  body("fromPrisonId").notEmpty().withMessage("From prison ID is required"),
  body("toPrisonId").notEmpty().withMessage("To prison ID is required"),
  body("escortStaffId").notEmpty().withMessage("Escort staff ID is required"),
  body("vehicleId").notEmpty().withMessage("Vehicle ID is required"),
  body("transferDate").isDate().withMessage("Invalid transfer date"),
  body("reason").notEmpty().withMessage("Reason is required"),
];

// Routes

/**
 * @desc    Get all transfer requests
 * @route   GET /api/transfer/getall-transfers
 * @access  Private (Admin, Police Officer, Security Staff)
 */
router.get(
  "/getall-transfers",
  authenticateToken,
//   authorize("admin", "police", "security"),
  getAllTransfers
);

/**
 * @desc    Get a single transfer request by ID
 * @route   GET /api/transfer/get-transfer/:id
 * @access  Private (Admin, Police Officer, Security Staff)
 */
router.get(
  "/get-transfer/:id",
  authenticateToken,
//   authorize("admin", "police", "security"),
  getTransferById
);

/**
 * @desc    Create a new transfer request
 * @route   POST /api/transfer/new-transfer
 * @access  Private (Admin, Police Officer)
 */
router.post(
  "/new-transfer",
  authenticateToken,
//   authorize("admin", "police"),
  transferValidationRules,
  createTransfer
);

/**
 * @desc    Update a transfer request by ID
 * @route   PUT /api/transfer/update-transfer/:id
 * @access  Private (Admin, Police Officer)
 */
router.put(
  "/update-transfer/:id",
  authenticateToken,
//   authorize("admin", "police"),
  transferValidationRules,
  updateTransfer
);

/**
 * @desc    Delete a transfer request by ID
 * @route   DELETE /api/transfer/delete-transfer/:id
 * @access  Private (Admin)
 */
router.delete(
  "/delete-transfer/:id",
  authenticateToken,
//   authorize("admin"),
  deleteTransfer
);

export default router;
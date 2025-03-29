import express from "express";
import {
  AllTransfers,
  getTransfer,
  addNewTransfer,
  updateTransfer,
  deleteTransfer,
} from "../controller/transfer.controller.js";
import { body } from "express-validator";
import { authenticateToken } from "../utilities.js";
// import { protect, authorize } from "../middleware/authMiddleware.js"; // For authentication and authorization

const router = express.Router();

// Validation rules for creating/updating a transfer request
const transferValidationRules = [
  body("inmateId").notEmpty().withMessage("Inmate ID is required"),
  body("fromPrison").notEmpty().withMessage("From prison is required"),
  body("toPrison").notEmpty().withMessage("To prison is required"),
  body("reason").notEmpty().withMessage("Reason is required"),
];

// Routes

/**
 * @desc    Get all transfer requests
 * @route   GET /api/transfer/all-transfers
 * @access  Private (Admin, Police Officer, Security Staff)
 */
router.get(
  "/all-transfers",
  authenticateToken,
//   authorize("admin", "police", "security"),
  AllTransfers
);

/**
 * @desc    Get a single transfer request by ID
 * @route   GET /api/transfer/:id
 * @access  Private (Admin, Police Officer, Security Staff)
 */
router.get(
  "/:id",
  authenticateToken,
//   authorize("admin", "police", "security"),
  getTransfer
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
  addNewTransfer
);

/**
 * @desc    Update a transfer request
 * @route   PUT /api/transfer/:id
 * @access  Private (Admin, Police Officer)
 */
router.put(
  "/:id",
  authenticateToken,
  transferValidationRules,
  updateTransfer
);

/**
 * @desc    Delete a transfer request
 * @route   DELETE /api/transfer/:id
 * @access  Private (Admin)
 */
router.delete(
  "/:id",
  authenticateToken,
  deleteTransfer
);

export default router;
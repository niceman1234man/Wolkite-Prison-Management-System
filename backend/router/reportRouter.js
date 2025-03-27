import express  from "express"
import {
  getDailyIntakeReport,
  getTransferStatistics,
  getLegalComplianceReport,
} from "../controller/reportController.js"; // Import report controller functions
import { query } from "express-validator"; // For request validation
// import { protect, authorize } from "../middleware/authMiddleware.js"; // For authentication and authorization
import { authenticateToken } from "../utilities.js";

const router = express.Router();

// Validation rules for date range
const dateRangeValidationRules = [
  query("startDate").isDate().withMessage("Invalid start date"),
  query("endDate").isDate().withMessage("Invalid end date"),
];

// Routes

/**
 * @desc    Get daily intake report
 * @route   GET /api/reports/daily-intake
 * @access  Private (Admin, Inspector)
 */
router.get(
  "/daily-intake",
  authenticateToken,
  // authorize("admin", "inspector"),
  dateRangeValidationRules,
  getDailyIntakeReport
);

/**
 * @desc    Get transfer statistics
 * @route   GET /api/reports/transfer-stats
 * @access  Private (Admin, Inspector)
 */
router.get(
  "/transfer-stats",
  authenticateToken,
  // authorize("admin", "inspector"),
  dateRangeValidationRules,
  getTransferStatistics
);

/**
 * @desc    Get legal compliance report
 * @route   GET /api/reports/legal-compliance
 * @access  Private (Admin, Inspector)
 */
router.get(
  "/legal-compliance",
  authenticateToken,
  // authorize("admin", "inspector"),
  dateRangeValidationRules,
  getLegalComplianceReport
);

export default router;
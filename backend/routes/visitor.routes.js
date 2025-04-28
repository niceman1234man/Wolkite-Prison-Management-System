import express from 'express';
import { check } from 'express-validator';
import * as visitorController from '../controller/visitor.controller.js';
import * as visitorScheduleController from '../controller/visitorSchedule.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();

// Visitor login - public route
router.post(
  "/login",
  [
    check("email", "Valid email is required").isEmail(),
    check("password", "Password is required").exists(),
  ],
  visitorController.login
);

// Register visitor - public route
router.post(
  "/register",
  [
    check("firstName", "First name is required").not().isEmpty(),
    check("lastName", "Last name is required").not().isEmpty(),
    check("email", "Valid email is required").isEmail(),
    check("password", "Password with 6 or more characters required").isLength({
      min: 6,
    }),
  ],
  visitorController.register
);

// Get visitors - protected route
router.get("/", authMiddleware, visitorController.getVisitors);

// Get visitor by ID - protected route
router.get("/:id", authMiddleware, visitorController.getVisitorById);

// Update visitor - protected route
router.put("/:id", authMiddleware, visitorController.updateVisitor);

// Delete visitor - protected route
router.delete("/:id", authMiddleware, visitorController.deleteVisitor);

// Upload visitor profile picture
router.post(
  "/upload/:id",
  authMiddleware,
  upload.single("profilePicture"),
  visitorController.uploadProfilePicture
);

// VISITOR SCHEDULE ROUTES
// Create visitor schedule with photo upload
router.post(
  '/schedule',
  authMiddleware,
  upload.fields([
    { name: 'idPhoto', maxCount: 1 },
    { name: 'visitorPhoto', maxCount: 1 }
  ]),
  [
    check('visitDate', 'Visit date is required').not().isEmpty(),
    check('purpose', 'Purpose is required').not().isEmpty(),
    check('relationship', 'Relationship is required').not().isEmpty(),
    check('idType', 'ID type is required').not().isEmpty(),
    check('idNumber', 'ID number is required').not().isEmpty(),
  ],
  visitorScheduleController.createVisitorSchedule
);

// Get visitor schedules - temporarily public for testing
router.get(
  "/schedule/schedules",
  visitorScheduleController.getVisitorSchedules
);

// Get visitor schedule by ID
router.get(
  "/schedule/:id",
  authMiddleware,
  visitorScheduleController.getVisitorScheduleById
);

// Update visitor schedule with photo upload
router.put(
  '/schedule/:id',
  authMiddleware,
  upload.fields([
    { name: 'idPhoto', maxCount: 1 },
    { name: 'visitorPhoto', maxCount: 1 }
  ]),
  visitorScheduleController.updateSchedule
);

// Delete visitor schedule
router.delete(
  "/schedule/:id",
  authMiddleware,
  visitorScheduleController.deleteVisitorSchedule
);

// Cancel visitor schedule
router.post(
  "/schedule/cancel/:id",
  authMiddleware,
  visitorScheduleController.cancelVisitorSchedule
);

// Get visitor capacity status - public route for testing
router.get(
  "/schedule/capacity",
  visitorScheduleController.getCapacityStatus
);

// Update visitor capacity - admin/police only
router.put(
  "/schedule/capacity",
  authMiddleware,
  visitorScheduleController.updateCapacity
);

// Check for face duplicates
router.post(
  "/check-face-duplicate",
  visitorController.checkFaceDuplicate
);

// Get all visitors for police officers
router.get(
  "/allVisitors",
  authMiddleware,
  visitorScheduleController.getAllVisitors
);

// Update visitor schedule status
router.put(
  "/schedule/:id/status",
  authMiddleware,
  visitorScheduleController.updateScheduleStatus
);

module.exports = router; 
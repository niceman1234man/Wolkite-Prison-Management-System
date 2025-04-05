const express = require("express");
const router = express.Router();
const visitorController = require("../controller/visitor.controller");
const { check } = require("express-validator");
const authMiddleware = require("../middleware/auth.middleware");
const visitorScheduleController = require("../controller/visitorSchedule.controller");
const upload = require("../middleware/upload.middleware");

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
// Create visitor schedule
router.post(
  "/schedule",
  [
    authMiddleware,
    check("date", "Date is required").not().isEmpty(),
    check("purpose", "Purpose is required").not().isEmpty(),
  ],
  visitorScheduleController.createVisitorSchedule
);

// Get visitor schedules
router.get(
  "/schedule/schedules",
  authMiddleware,
  visitorScheduleController.getVisitorSchedules
);

// Get visitor schedule by ID
router.get(
  "/schedule/:id",
  authMiddleware,
  visitorScheduleController.getVisitorScheduleById
);

// Update visitor schedule
router.put(
  "/schedule/schedule/:id",
  authMiddleware,
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

// Get visitor capacity status
router.get(
  "/schedule/capacity",
  authMiddleware,
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

module.exports = router; 
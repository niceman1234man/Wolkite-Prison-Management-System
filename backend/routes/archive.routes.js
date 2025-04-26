const express = require('express');
const router = express.Router();
const archiveController = require('../controllers/archive.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

// Role-based access constants
const ALL_ROLES = ['admin', 'inspector', 'police-officer', 'security', 'woreda', 'court'];

// Get archived items with filtering and pagination
// Accessible by all authenticated users - role-based filtering applied in controller
router.get('/', 
  authenticate, 
  authorize(ALL_ROLES), 
  archiveController.getArchivedItems
);

// Get details of a specific archived item
router.get('/:id', 
  authenticate, 
  authorize(ALL_ROLES),
  archiveController.getArchivedItemDetails
);

// Restore an archived item
router.post('/:id/restore', 
  authenticate, 
  authorize(ALL_ROLES),
  archiveController.restoreArchivedItem
);

// Permanently delete an archived item
router.delete('/:id', 
  authenticate, 
  authorize(ALL_ROLES),
  archiveController.permanentlyDeleteArchivedItem
);

module.exports = router; 
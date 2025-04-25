import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { 
  getArchivedItems, 
  getArchivedItemDetails, 
  restoreArchivedItem, 
  permanentlyDeleteArchivedItem 
} from '../controllers/archive.controller.js';

const router = express.Router();

// Role-based access constants
const ALL_ROLES = ['admin', 'inspector', 'police-officer', 'security', 'woreda', 'court'];
const ADMIN_ONLY = ['admin'];

// Get archived items with filtering and pagination
// Accessible by all authenticated users with role-based filtering
router.get('/', 
  authenticateToken, 
  authorize(ALL_ROLES), 
  getArchivedItems
);

// Get details of a specific archived item
router.get('/:id', 
  authenticateToken, 
  authorize(ALL_ROLES),
  getArchivedItemDetails
);

// Restore an archived item
// Add inspector explicitly for restoring prison archives
router.post('/:id/restore', 
  authenticateToken, 
  authorize(['admin', 'inspector', 'police-officer']),
  restoreArchivedItem
);

// Permanently delete an archived item
router.delete('/:id', 
  authenticateToken, 
  authorize(['admin', 'inspector', 'police-officer']),
  permanentlyDeleteArchivedItem
);

export default router; 
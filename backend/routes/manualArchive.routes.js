import express from 'express';
import { createManualArchive, restoreManualArchive, permanentlyDeleteManualArchive } from '../controllers/manualArchive.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// No-auth routes for easy access (for development and simple integration)
router.post('/no-auth', createManualArchive);
router.post('/no-auth/:id/restore', restoreManualArchive);
router.delete('/no-auth/:id', permanentlyDeleteManualArchive);

// Routes that don't require authentication (default routes - still kept for backward compatibility)
router.post('/', createManualArchive);
router.post('/:id/restore', restoreManualArchive);
router.delete('/:id', permanentlyDeleteManualArchive);

// Authenticated routes (commented out for simplicity)
// router.post('/', authenticateToken, createManualArchive);
// router.post('/:id/restore', authenticateToken, restoreManualArchive);
// router.delete('/:id', authenticateToken, permanentlyDeleteManualArchive);

export default router; 
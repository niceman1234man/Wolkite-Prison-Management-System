import express from 'express';
import { translateSingleText, translateMultipleTextsEndpoint, translateObjectEndpoint } from '../controller/translation.controller.js';
import { protect } from '../controller/authController.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/text', translateSingleText);
router.post('/batch', translateMultipleTextsEndpoint);
router.post('/object', translateObjectEndpoint);

// Protected routes (authentication required)
// These routes can be rate-limited differently or have other restrictions
router.post('/text/auth', protect, translateSingleText);
router.post('/batch/auth', protect, translateMultipleTextsEndpoint);
router.post('/object/auth', protect, translateObjectEndpoint);

export default router; 
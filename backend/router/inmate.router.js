import express from 'express'
import { authenticateToken } from '../utilities.js';
import { addnewInmate, deleteInmate, getAllInmates, getInmate, updateInmate } from '../controller/inmate.controller.js';
import { upload } from '../fileMiddleware.js';
import path from 'path';
import fs from 'fs';
import { archiveMiddleware } from '../utils/archiveHelper.js';

// Create inmates upload directory if it doesn't exist
const createInmateUploadDir = () => {
  const uploadDir = path.join(process.cwd(), 'uploads', 'inmates');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Inmates upload directory created at:', uploadDir);
  }
}

// Ensure upload directory exists
createInmateUploadDir();

export const inmateRouter=express.Router();
inmateRouter.post('/new-inmate', authenticateToken, upload.single('inmatePhoto'), addnewInmate);
inmateRouter.get('/allInmates', authenticateToken, getAllInmates);
inmateRouter.get('/get-inmate/:id', authenticateToken, getInmate);
inmateRouter.get('/inmate/:id', authenticateToken, getInmate);
inmateRouter.put('/update-inmate/:id', authenticateToken, updateInmate);
inmateRouter.delete('/delete-inmate/:id', authenticateToken, archiveMiddleware('inmate'), deleteInmate);

// Add a simple test endpoint that doesn't require authentication
inmateRouter.get('/test', (req, res) => {
  res.status(200).json({ message: "Inmate router is working correctly!" });
});


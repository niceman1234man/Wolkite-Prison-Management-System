import express from 'express'
import { authenticateToken } from '../utilities.js';
import { addnewInmate, deleteInmate, getAllInmates, getInmate, updateInmate } from '../controller/inmate.controller.js';
import { upload } from '../fileMiddleware.js';
import path from 'path';
import fs from 'fs';

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
inmateRouter.put('/update-inmate/:id', authenticateToken, updateInmate);
inmateRouter.delete('/delete-inmate/:id', authenticateToken, deleteInmate);


import express from 'express'
import { createAccount,getUser,getAllUsers,login, updateUser, updatePassword, activateUser, deleteUser, ForgotPassword, ResetPassword, updateProfile } from '../controller/user.controller.js';
import { authenticateToken } from '../utilities.js';
import { upload } from '../fileMiddleware.js';
export const userRouter = express.Router();
userRouter.post('/create-account',upload.single("photo"),createAccount);
userRouter.post('/login',login);
userRouter.get('/getAlluser',authenticateToken,getAllUsers);
userRouter.get('/get-user/:id',authenticateToken,getUser);
userRouter.put('/update-user/:id',upload.single("photo"),authenticateToken,updateProfile);
userRouter.put('/update-password',authenticateToken,updatePassword);
userRouter.put('/activate-user/:id',authenticateToken,activateUser);
userRouter.delete('/delete-user/:id',authenticateToken,deleteUser);
userRouter.post('/forget',ForgotPassword);
userRouter.post('/reset/:id/:token', ResetPassword);

// Debug route - REMOVE IN PRODUCTION
userRouter.get('/sample-users', async (req, res) => {
  try {
    // Only in development
    if (process.env.NODE_ENV !== "production") {
      const { User } = await import("../models/User.js");
      // Get 5 sample staff accounts (without password)
      const sampleUsers = await User.find()
        .select("email firstName lastName role isactivated")
        .limit(5)
        .lean();
      
      return res.json({ users: sampleUsers });
    }
    return res.status(404).json({ message: "Not found" });
  } catch (error) {
    console.error("Error in sample-users route:", error);
    return res.status(500).json({ message: "Server error" });
  }
});
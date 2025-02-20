import express from 'express'
import { createAccount,getUser,getAllUsers,login, updateUser } from '../controller/user.controller.js';
import { authenticateToken } from '../utilities.js';
export const userRouter=express.Router();
userRouter.post('/create-account',createAccount);
userRouter.post('/login',login);
userRouter.get('/getAlluser',authenticateToken,getAllUsers);
userRouter.get('/get-user/:id',authenticateToken,getUser);
userRouter.put('/update-user/:id',authenticateToken,updateUser);
import express from 'express'
import { authenticateToken } from '../utilities.js';
import { allVisitors, getVisitor, visitorInformation } from '../controller/visitor.controller.js';
export const visitorRouter=express.Router();
visitorRouter.post('/new-visitor',authenticateToken,visitorInformation);
visitorRouter.get('/allVisitors',authenticateToken,allVisitors);
visitorRouter.get('/get-Visitor/:id',authenticateToken,getVisitor);

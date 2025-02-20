import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDb } from './config/db.js';
import { userRouter } from './router/user.router copy.js';
import { visitorRouter } from './router/visitor.router.js';
import { incidentRouter } from './router/incident.router.js';
import { inmateRouter } from './router/inmate.router.js';
const app =express();
app.use(express.json());
app.use(cors({
    origin:"http://localhost:5173",
    credentials: true,
    
}));
 app.use('/user',userRouter);
 app.use('/visitor',visitorRouter);
 app.use('/incidents',incidentRouter);
 app.use('/inmates',inmateRouter);
 connectDb();

app.listen(5000,()=>{
    console.log("server running")
});


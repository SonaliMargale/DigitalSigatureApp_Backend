
import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import connectDB from "./config/mongodb.js";
import authRouter from "./routes/authRoutes.js"
import userRouter from "./routes/userRoutes.js";
import mongoose from "mongoose";

const app = express();
const port = process.env.PORT || 4000
connectDB()

app.use(express.json());
app.use(cookieParser());
app.use(cors({credentials:true}))

app.get('/', (req,res) => res.send("API WORKING"))
app.use('/api/auth',authRouter)
app.use('/api/user',userRouter)

console.log("Mongoose connection readyState:", mongoose.connection.readyState)
app.listen(port, ()=> console.log(`server started on ${port}`))
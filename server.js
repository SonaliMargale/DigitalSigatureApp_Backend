
import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import connectDB from "./config/mongodb.js";
import authRouter from "./routes/authRoutes.js"
import userRouter from "./routes/userRoutes.js";
import mongoose from "mongoose";
import pdfRoutes from "./routes/pdfRoutes.js"
import signatureRouter from "./routes/signatureRoutes.js";

const app = express();
const port = process.env.PORT || 4000
connectDB()

const allowedOrigins = ['http://localhost:5173']

app.use(express.json());
app.use(cookieParser());
app.use(cors({origin:allowedOrigins,credentials:true}))
app.use("/uploads",express.static("uploads"))


app.get('/', (req,res) => res.send("API WORKING"))
app.use('/api/auth',authRouter)
app.use('/api/user',userRouter)
app.use("/api/docs",pdfRoutes)
app.use('/api/signatures',signatureRouter)
app.use('/signed', express.static('signed'));


console.log("Mongoose connection readyState:", mongoose.connection.readyState)
app.listen(port, ()=> console.log(`server started on ${port}`))
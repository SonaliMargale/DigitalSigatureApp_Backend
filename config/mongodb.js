
import mongoose from "mongoose";

const connectDB = async () => {

    mongoose.connection.on('connected', ()=> console.log("database connected"))
    console.log(process.env.MONGODB_URI,"mongodb url connection")

    await mongoose.connect(`${process.env.MONGODB_URI}/signature-app-backend`)
};

export default connectDB




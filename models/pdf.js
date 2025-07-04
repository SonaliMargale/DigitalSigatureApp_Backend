import mongoose from "mongoose";

const pdfSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  path: String,
  size: Number,
  userId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User"
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("pdf", pdfSchema);

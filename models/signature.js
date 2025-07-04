import mongoose from "mongoose";
const signatureSchema = new mongoose.Schema({
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'pdf',
    required: true,
  },
  coordinates: {
    x: Number,
    y: Number,
    page: Number,
  },
  signer: {
    type: String,
    required: true,
  },
  signature: {
    type: Object, 
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'signed', 'fulfilled'],
    default: 'pending',
  },
});


export default mongoose.model('Signature',signatureSchema)
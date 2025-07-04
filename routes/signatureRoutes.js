import express from "express";
import {
  saveSignaturePosition,
  getSignaturesByFileId,
  finalizeSignature,
  saveSignature,
  finalizeSignatures
} from "../controllers/signatureController.js";

const signatureRouter = express.Router();


signatureRouter.post("/position", saveSignaturePosition);
signatureRouter.post("/save", saveSignature);
signatureRouter.get("/:id", getSignaturesByFileId);
signatureRouter.post("/finalize", finalizeSignature);
signatureRouter.post("/finalize/:fileId", finalizeSignatures);

export default signatureRouter;

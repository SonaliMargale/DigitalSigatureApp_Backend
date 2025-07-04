import express from "express";
import upload from "../middleware/multer.js";
import { uploadPdf, getUserPdfs,getPdfById} from "../controllers/pdfController.js";
import userAuth from "../middleware/userAuth.js";

const router = express.Router();

router.post("/upload",userAuth,upload.single("pdf"),uploadPdf)
router.get("/", userAuth,getUserPdfs);        
router.get("/:id",userAuth, getPdfById); 

export default router;
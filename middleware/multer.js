import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
})

const fileFilter = (req,file,cb) => {
  const ext = path.extname(file.originalname);
  if (ext !== ".pdf") {
    return cb(new Error("Only PDFs are allowed"), false);
  }
  cb(null, true);
}

const upload = multer({ storage: storage, fileFilter })

export default upload;
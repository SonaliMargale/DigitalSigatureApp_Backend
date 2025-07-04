import pdf from "../models/pdf.js";

export const uploadPdf = async (req, res) => {

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "no file uploaded" })
    }
    console.log("File info:", req.file);
    console.log("Logged-in user:", req.user);
    const { originalname, filename, path, size } = req.file;

    const pdfDoc = new pdf({
      filename,
      originalName: originalname,
      path,
      size,
      userId: req.user._id,
    })

    await pdfDoc.save();

    res.status(201).json({ success: true, message: "PDF upload successfully", data: pdfDoc })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  };

}

export const getUserPdfs = async (req, res) => {
  try {
    const userId = req.user._id;
    const pdfs = await pdf.find({ userId }).sort({ uploadedAt: -1 })
    res.status(200).json({ success: true, data: pdfs })

  } catch (error) {
    res.status(500).json({ success: false, message: "failed to fetch Pdf" })

  }

}


export const getPdfById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    console.log("userId", userId)
    console.log("PDF with id", id)

    const pdfDoc = await pdf.findOne({ _id: id, userId });
    console.log("match pdf", pdfDoc)

    if (!pdfDoc) {
      return res.status(404).json({ success: false, message: "PDF not found" });
    }

    res.status(200).json({ success: true, data: pdfDoc });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error retrieving PDF" });
  }

};
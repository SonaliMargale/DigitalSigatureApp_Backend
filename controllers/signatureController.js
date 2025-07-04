import Signature from "../models/signature.js";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import Pdf from '../models/pdf.js';



export const saveSignaturePosition = async (req, res) => {
  try {
    const { fileId, coordinates, signer, signature, status } = req.body;
    if (
      !fileId?.trim() ||
      typeof signer !== "string" ||
      !signer?.trim() ||
      typeof signature !== "object" ||
      !signature?.text ||
      !coordinates ||
      typeof coordinates !== "object"
    ) {
      return res.status(400).json({ success: false, message: "Missing or invalid required fields" });
    }

    const { x, y, page } = coordinates;
    if (
      typeof x !== "number" ||
      typeof y !== "number" ||
      typeof page !== "number"
    ) {
      return res.status(400).json({ success: false, message: "Invalid coordinate values" });
    }

    const newSignature = new Signature({
      fileId,
      coordinates: { x, y, page },
      signer,
      signature,
      status: status || "pending"
    });

    await newSignature.save();

    res.status(201).json({ success: true, data: newSignature });
  } catch (err) {
    console.error("Error saving signature:", err.message);
    res.status(500).json({ success: false, message: "Failed to save signature" });
  }
};


// Get all signatures for a PDF
export const getSignaturesByFileId = async (req, res) => {
  try {
    const { id } = req.params;
    const signatures = await Signature.find({ fileId: id });
    res.status(200).json({ success: true, data: signatures });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching signatures' });
  }
};

export const finalizeSignature = async (req, res) => {
  try {
    const { fileId } = req.body;
    await Signature.updateMany({ fileId }, { $set: { status: 'signed' } });
    res.status(200).json({ success: true, message: "Signature finalized" });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to finalize signature' });
  }
};

// Save a single signature from frontend
export const saveSignature = async (req, res) => {
  try {
    const { fileId, coordinates, signer, signature, status } = req.body;

    if (
      !fileId?.trim() ||
      !signer?.trim() ||
      typeof signature !== "object" ||
      typeof coordinates !== "object"
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing or invalid required fields (top-level)"
      });
    }

    const { x, y, page } = coordinates;

    if (
      typeof x !== "number" ||
      typeof y !== "number" ||
      typeof page !== "number"
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing or invalid coordinates"
      });
    }

    const validSigner = signer.trim() || "guest@example.com";

    const newSignature = new Signature({
      fileId,
      coordinates: { x, y, page },
      signer: validSigner,
      signature,
      status: status || "pending"
    });

    await newSignature.save();

    res.status(201).json({
      success: true,
      message: "Signature saved",
      data: newSignature
    });
  } catch (err) {
    console.error(" Error saving signature:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const finalizeSignatures = async (req, res) => {
  try {
    const { fileId } = req.params;

    console.log("📩 Finalizing signatures for fileId:", fileId);

    const pdfRecord = await Pdf.findById(fileId);
    if (!pdfRecord) {
      return res.status(404).json({ success: false, message: "PDF not found in DB" });
    }

    const inputPath = path.resolve(`uploads/${pdfRecord.filename}`);
    console.log("📄 Input PDF path:", inputPath);

    if (!fs.existsSync(inputPath)) {
      return res.status(404).json({ success: false, message: "Original PDF file not found on disk" });
    }

    const pdfBytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const signatures = await Signature.find({ fileId, status: "pending" });
    console.log(" Total signatures to embed:", signatures.length);

    for (const sig of signatures) {
      const { x, y, page } = sig.coordinates;
      const pdfPage = pdfDoc.getPage(page - 1);
      const { width, height } = pdfPage.getSize();

      const absX = x * width;
      const absY = y * height;

      console.log("🔹 Embedding signature:", sig.signature);
      console.log("   → Position:", { absX, absY });

      if (sig.signature?.type === "typed") {
        pdfPage.drawText(sig.signature.text, {
          x: absX,
          y: absY,
          size: 18,
          font,
          color: rgb(0, 0, 0),
        });
      }

      if (sig.signature?.type === "drawn" && sig.signature.image?.startsWith("data:image")) {
        try {
          const base64Data = sig.signature.image.split(',')[1];
          const pngImage = await pdfDoc.embedPng(Buffer.from(base64Data, 'base64'));

          pdfPage.drawImage(pngImage, {
            x: absX,
            y: absY,
            width: 150,
            height: 60,
          });
        } catch (imgErr) {
          console.warn(" Failed to embed drawn image:", imgErr.message);
          continue;
        }
      }

      sig.status = "fulfilled";
      await sig.save();
    }

    let signedBytes, signedFilename, outputPath;
    try {
      signedBytes = await pdfDoc.save();
      signedFilename = `${fileId}-signed.pdf`;
      outputPath = path.resolve(`signed/${signedFilename}`);

      if (!fs.existsSync("signed")) {
        console.warn("📁 'signed/' folder missing. Creating it...");
        fs.mkdirSync("signed");
      }

      fs.writeFileSync(outputPath, signedBytes);
    } catch (saveErr) {
      console.error(" Error saving signed PDF to disk:", saveErr.message);
      return res.status(500).json({
        success: false,
        message: "Failed to write signed PDF",
        error: saveErr.message,
      });
    }

    // 4. Return signed PDF path
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${signedFilename}"`,
    });
    res.send(signedBytes)

  } catch (error) {
    console.error(" Finalize PDF Error:", error.message);
    console.error(error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to finalize PDF",
      error: error.message,
    });
  }
};


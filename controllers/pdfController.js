const Pdf = require("../models/pdfModel");
const { cloudinary } = require("../config/cloudinary");
const { processAndEmbedPdf } = require("../services/vectorService");
const axios = require("axios");

const getPdfs = async (req, res) => {
  try {
    const pdfs = await Pdf.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(pdfs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a file" });
    }

    const pdf = await Pdf.create({
      user: req.user.id,
      fileName: req.file.originalname,
      fileUrl: req.file.path,
      cloudinaryId: req.file.filename,
    });

    res.status(201).json(pdf);

    processAndEmbedPdf(pdf._id, req.file.path);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deletePdf = async (req, res) => {
  try {
    const pdf = await Pdf.findById(req.params.id);

    if (!pdf) {
      return res.status(404).json({ message: "PDF not found" });
    }

    if (pdf.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await cloudinary.uploader.destroy(pdf.cloudinaryId, {
      resource_type: "raw",
    });
    await pdf.deleteOne();

    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const seedNCERTPdfs = async (req, res) => {
  try {
    const ncertPdfs = [
      {
        fileName: "NCERT Physics Class XI - Chapter 1.pdf",
        url: "https://ncert.nic.in/textbook/pdf/keph101.pdf",
      },
      {
        fileName: "NCERT Physics Class XI - Chapter 2.pdf",
        url: "https://ncert.nic.in/textbook/pdf/keph102.pdf",
      },
      {
        fileName: "NCERT Physics Class XI - Chapter 3.pdf",
        url: "https://ncert.nic.in/textbook/pdf/keph103.pdf",
      },
    ];

    const uploadedPdfs = [];

    for (const pdfInfo of ncertPdfs) {
      const existingPdf = await Pdf.findOne({
        user: req.user.id,
        fileName: pdfInfo.fileName,
      });

      if (!existingPdf) {
        const response = await axios.get(pdfInfo.url, {
          responseType: "arraybuffer",
        });
        const buffer = Buffer.from(response.data);

        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: "revision-app-pdfs",
                resource_type: "raw",
                public_id: `ncert_${Date.now()}`,
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            )
            .end(buffer);
        });

        const pdf = await Pdf.create({
          user: req.user.id,
          fileName: pdfInfo.fileName,
          fileUrl: uploadResult.secure_url,
          cloudinaryId: uploadResult.public_id,
        });

        uploadedPdfs.push(pdf);
        processAndEmbedPdf(pdf._id, uploadResult.secure_url);
      }
    }

    res.status(201).json({
      message: "NCERT PDFs seeded successfully",
      pdfs: uploadedPdfs,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPdfs, uploadPdf, deletePdf, seedNCERTPdfs };

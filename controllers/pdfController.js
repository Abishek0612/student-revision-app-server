const Pdf = require("../models/pdfModel");
const path = require("path");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const { processAndEmbedPdf } = require("../services/vectorService");

const getPdfs = async (req, res) => {
  const pdfs = await Pdf.find({ user: req.user.id });
  res.status(200).json(pdfs);
};

const uploadPdf = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Please upload a file" });
  }

  const pdf = await Pdf.create({
    user: req.user.id,
    fileName: req.file.originalname,
    filePath: req.file.path,
  });

  res.status(201).json(pdf);

  processAndEmbedPdf(pdf._id, req.file.path);
};

module.exports = { getPdfs, uploadPdf };

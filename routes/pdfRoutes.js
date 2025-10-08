const express = require("express");
const router = express.Router();
const { getPdfs, uploadPdf } = require("../controllers/pdfController");
const { protect } = require("../middleware/authMiddleware");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router
  .route("/")
  .get(protect, getPdfs)
  .post(protect, upload.single("pdf"), uploadPdf);

module.exports = router;

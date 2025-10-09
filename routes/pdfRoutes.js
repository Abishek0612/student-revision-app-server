const express = require("express");
const router = express.Router();
const {
  getPdfs,
  uploadPdf,
  deletePdf,
  retryPdf,
  seedNCERTPdfs,
} = require("../controllers/pdfController");
const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../config/cloudinary");

router
  .route("/")
  .get(protect, getPdfs)
  .post(protect, upload.single("pdf"), uploadPdf);
router.delete("/:id", protect, deletePdf);
router.post("/:id/retry", protect, retryPdf);
router.post("/seed-ncert", protect, seedNCERTPdfs);

module.exports = router;

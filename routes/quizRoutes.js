const express = require("express");
const router = express.Router();
const {
  generateQuiz,
  submitQuiz,
  getProgress,
} = require("../controllers/quizController");
const { protect } = require("../middleware/authMiddleware");

router.post("/generate", protect, generateQuiz);
router.post("/submit", protect, submitQuiz);
router.get("/progress", protect, getProgress);

module.exports = router;

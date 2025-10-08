const express = require("express");
const router = express.Router();
const { getRecommendations } = require("../controllers/youtubeController");
const { protect } = require("../middleware/authMiddleware");

router.post("/recommendations", protect, getRecommendations);

module.exports = router;

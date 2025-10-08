const axios = require("axios");
const { generateSearchQuery } = require("../services/llmService");

const getRecommendations = async (req, res) => {
  try {
    const { topic, pdfId } = req.body;

    let searchQuery = topic;

    if (!searchQuery && pdfId) {
      const Pdf = require("../models/pdfModel");
      const pdf = await Pdf.findById(pdfId);
      if (pdf && pdf.fileName) {
        searchQuery = await generateSearchQuery(pdf.fileName);
      }
    }

    if (!searchQuery) {
      return res.status(400).json({ message: "Topic or PDF ID is required" });
    }

    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          q: searchQuery + " educational tutorial",
          type: "video",
          videoDuration: "medium",
          maxResults: 10,
          key: process.env.YOUTUBE_API_KEY,
        },
      }
    );

    const videos = response.data.items.map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
    }));

    res.status(200).json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getRecommendations };

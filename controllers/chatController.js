const Chat = require("../models/chatModel");
const Pdf = require("../models/pdfModel");
const { getRelevantContext } = require("../services/vectorService");
const { generateChatResponse } = require("../services/llmService");

const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.user.id })
      .populate("pdf", "fileName")
      .sort({ updatedAt: -1 });
    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createChat = async (req, res) => {
  try {
    const { pdfId, title } = req.body;

    const chat = await Chat.create({
      user: req.user.id,
      pdf: pdfId || null,
      title: title || "New Chat",
    });

    const populatedChat = await Chat.findById(chat._id).populate(
      "pdf",
      "fileName"
    );
    res.status(201).json(populatedChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id).populate("pdf", "fileName");

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (chat.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { chatId, message, pdfIds } = req.body;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (chat.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    chat.messages.push({
      role: "user",
      content: message,
    });

    let context = "";
    let citations = [];

    if (pdfIds && pdfIds.length > 0) {
      const contextResults = await getRelevantContext(message, pdfIds, 5);
      context = contextResults.context;
      citations = contextResults.citations;
    }

    const response = await generateChatResponse(
      message,
      context,
      chat.messages.slice(-10)
    );

    chat.messages.push({
      role: "assistant",
      content: response,
      citations: citations,
    });

    if (chat.messages.length === 2 && chat.title === "New Chat") {
      chat.title = message.slice(0, 50) + (message.length > 50 ? "..." : "");
    }

    await chat.save();

    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (chat.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await chat.deleteOne();
    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getChats,
  createChat,
  getChatById,
  sendMessage,
  deleteChat,
};

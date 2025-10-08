const mongoose = require("mongoose");

const messageSchema = mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  citations: [
    {
      pageNumber: Number,
      snippet: String,
    },
  ],
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const chatSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    title: {
      type: String,
      default: "New Chat",
    },
    pdf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pdf",
    },
    messages: [messageSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Chat", chatSchema);

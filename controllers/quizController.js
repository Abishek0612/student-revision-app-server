const Pdf = require("../models/pdfModel");
const QuizAttempt = require("../models/quizAttemptModel");
const { generateQuizQuestions } = require("../services/llmService");
const { getRelevantContext } = require("../services/vectorService");

const generateQuiz = async (req, res) => {
  const { pdfId, questionCount, questionTypes } = req.body;

  const pdf = await Pdf.findById(pdfId);
  if (!pdf || pdf.user.toString() !== req.user.id) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const randomContext = await getRelevantContext("", pdfId, 5);
    const quiz = await generateQuizQuestions(
      randomContext,
      questionCount,
      questionTypes
    );
    res.status(200).json(quiz);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to generate quiz", error: error.message });
  }
};

const submitQuiz = async (req, res) => {
  const { pdfId, score, totalQuestions, answers } = req.body;

  const attempt = await QuizAttempt.create({
    user: req.user.id,
    pdf: pdfId,
    score,
    totalQuestions,
    answers,
  });

  res.status(201).json(attempt);
};

const getProgress = async (req, res) => {
  const attempts = await QuizAttempt.find({ user: req.user.id }).populate(
    "pdf",
    "fileName"
  );
  res.status(200).json(attempts);
};

module.exports = { generateQuiz, submitQuiz, getProgress };

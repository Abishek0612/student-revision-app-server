const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateQuizQuestions = async (context, count, types) => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `Based on the following text, generate a quiz with ${count} questions. 
    The question types should be a mix of ${types.join(", ")}.
    For each question, provide the question, options (for MCQ), the correct answer, and a brief explanation.
    You must format the entire output as a single JSON object. The object should have a single key "questions" which is an array of question objects.
    Do not include any text or formatting like backticks before or after the JSON object.
    Each question object must have: "type" (MCQ, SAQ, LAQ), "question", "options" (an array of strings for MCQ, null otherwise), "answer", and "explanation".

    Context:
    ---
    ${context}
    ---
    `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const content = JSON.parse(text);
    return content.questions;
  } catch (error) {
    console.error("Error generating quiz with Gemini:", error);
    throw new Error("Google AI API call failed");
  }
};

module.exports = { generateQuizQuestions };

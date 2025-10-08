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
    let text = response.text();

    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "");

    const content = JSON.parse(text);
    return content.questions;
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error("Failed to generate quiz questions");
  }
};

const generateChatResponse = async (userMessage, context, chatHistory) => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const historyText = chatHistory
    .slice(-6)
    .map(
      (msg) => `${msg.role === "user" ? "Student" : "Teacher"}: ${msg.content}`
    )
    .join("\n");

  const prompt = `You are a helpful teacher assistant for students. Answer the student's question based on the context provided from their coursebooks.

${context ? `Context from coursebooks:\n---\n${context}\n---\n\n` : ""}

Previous conversation:
${historyText}

Student: ${userMessage}

Teacher:`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating chat response:", error);
    throw new Error("Failed to generate response");
  }
};

const generateSearchQuery = async (fileName) => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `Given this PDF filename: "${fileName}", generate a concise search query (max 5 words) to find relevant educational YouTube videos. Only return the search query, nothing else.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Error generating search query:", error);
    return fileName.replace(".pdf", "");
  }
};

module.exports = {
  generateQuizQuestions,
  generateChatResponse,
  generateSearchQuery,
};

const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean);

let currentKeyIndex = 0;

function getGenAIInstance() {
  const apiKey = GEMINI_KEYS[currentKeyIndex];
  return new GoogleGenerativeAI(apiKey);
}

function rotateKey() {
  currentKeyIndex = (currentKeyIndex + 1) % GEMINI_KEYS.length;
  console.warn(
    ` Rotating Gemini API key... Now using key index: ${currentKeyIndex + 1}`
  );
}

async function withKeyRotation(operation) {
  const maxAttempts = GEMINI_KEYS.length;
  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      const genAI = getGenAIInstance();
      return await operation(genAI);
    } catch (err) {
      const message = err.response?.data?.error?.message || err.message;
      console.error(
        `Gemini API error (key ${currentKeyIndex + 1}): ${message}`
      );

      if (
        message.includes("quota") ||
        message.includes("exceeded") ||
        message.includes("API key")
      ) {
        rotateKey();
        attempt++;
      } else {
        throw err;
      }
    }
  }

  throw new Error("All Gemini API keys failed or exhausted.");
}

module.exports = { withKeyRotation };

const Pdf = require("../models/pdfModel");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });

const processAndEmbedPdf = async (pdfId, filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    const text = data.text;
    const chunks = chunkText(text);

    const result = await embeddingModel.batchEmbedContents({
      requests: chunks.map((chunk) => ({ content: chunk })),
    });

    const embeddings = result.embeddings.map((embedding, index) => ({
      text: chunks[index],
      embedding: embedding.values,
    }));

    await Pdf.findByIdAndUpdate(pdfId, { status: "ready", chunks: embeddings });
    console.log(`PDF ${pdfId} processed and embedded using Gemini.`);
  } catch (error) {
    console.error(`Error processing PDF ${pdfId}:`, error);
    await Pdf.findByIdAndUpdate(pdfId, { status: "error" });
  }
};

const getRelevantContext = async (query, pdfId, k = 3) => {
  const pdf = await Pdf.findById(pdfId);
  if (!pdf || pdf.status !== "ready") {
    throw new Error("PDF not ready for querying");
  }
  // This is a simplified search for demonstration.
  // For production, this should be a real vector similarity search.
  const randomChunks = pdf.chunks.sort(() => 0.5 - Math.random()).slice(0, k);
  return randomChunks.map((c) => c.text).join("\n\n");
};

const chunkText = (text, chunkSize = 1000, overlap = 100) => {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    const end = i + chunkSize;
    chunks.push(text.substring(i, end));
    i += chunkSize - overlap;
  }
  return chunks;
};

module.exports = { processAndEmbedPdf, getRelevantContext };

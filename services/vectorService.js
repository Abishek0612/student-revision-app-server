const Pdf = require("../models/pdfModel");
const pdfParse = require("pdf-parse");
const axios = require("axios");
const { withKeyRotation } = require("./geminiClient");

const processAndEmbedPdf = async (pdfId, fileUrl) => {
  return withKeyRotation(async (genAI) => {
    const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });

    try {
      const response = await axios.get(fileUrl, {
        responseType: "arraybuffer",
      });
      const dataBuffer = Buffer.from(response.data);
      const data = await pdfParse(dataBuffer);
      const text = data.text;
      const totalPages = data.numpages;

      const chunks = chunkTextWithPages(text, totalPages);
      const batchSize = 100;
      const allEmbeddings = [];

      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const result = await embeddingModel.batchEmbedContents({
          requests: batch.map((chunk) => ({
            content: { parts: [{ text: chunk.text }] },
          })),
        });

        const embeddings = result.embeddings.map((embedding, index) => ({
          text: batch[index].text,
          embedding: embedding.values,
          pageNumber: batch[index].pageNumber,
        }));

        allEmbeddings.push(...embeddings);
      }

      await Pdf.findByIdAndUpdate(pdfId, {
        status: "ready",
        chunks: allEmbeddings,
        totalPages: totalPages,
      });

      console.log(`PDF ${pdfId} processed and embedded.`);
    } catch (error) {
      console.error(`Error processing PDF ${pdfId}:`, error);
      await Pdf.findByIdAndUpdate(pdfId, { status: "error" });
    }
  });
};

const getRelevantContext = async (query, pdfIds, k = 5) => {
  return withKeyRotation(async (genAI) => {
    const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });

    try {
      const queryEmbedding = await embeddingModel.embedContent({
        content: { parts: [{ text: query }] },
      });
      const queryVector = queryEmbedding.embedding.values;

      const pdfs = await Pdf.find({
        _id: { $in: pdfIds },
        status: "ready",
      });

      if (pdfs.length === 0) {
        return { context: "", citations: [] };
      }

      let allChunks = [];
      pdfs.forEach((pdf) => {
        pdf.chunks.forEach((chunk) => {
          allChunks.push({
            ...chunk.toObject(),
            pdfId: pdf._id,
            fileName: pdf.fileName,
          });
        });
      });

      const scoredChunks = allChunks.map((chunk) => ({
        ...chunk,
        similarity: cosineSimilarity(queryVector, chunk.embedding),
      }));

      scoredChunks.sort((a, b) => b.similarity - a.similarity);
      const topChunks = scoredChunks.slice(0, k);

      const context = topChunks.map((c) => c.text).join("\n\n");
      const citations = topChunks.map((c) => ({
        pageNumber: c.pageNumber,
        snippet: c.text.slice(0, 200) + "...",
        fileName: c.fileName,
      }));

      return { context, citations };
    } catch (error) {
      console.error("Error getting relevant context:", error);
      return { context: "", citations: [] };
    }
  });
};

const chunkTextWithPages = (text, totalPages, chunkSize = 1000) => {
  const chunks = [];
  const avgCharsPerPage = Math.ceil(text.length / totalPages);

  let currentPos = 0;
  while (currentPos < text.length) {
    const chunkText = text.slice(currentPos, currentPos + chunkSize);
    const estimatedPage = Math.ceil(currentPos / avgCharsPerPage) + 1;

    chunks.push({
      text: chunkText,
      pageNumber: Math.min(estimatedPage, totalPages),
    });

    currentPos += chunkSize;
  }

  return chunks;
};

const cosineSimilarity = (vecA, vecB) => {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
};

module.exports = { processAndEmbedPdf, getRelevantContext };

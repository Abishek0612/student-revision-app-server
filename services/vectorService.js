const Pdf = require("../models/pdfModel");
const pdfParse = require("pdf-parse");
const axios = require("axios");
const { withKeyRotation } = require("./geminiClient");

const processAndEmbedPdf = async (pdfId, fileUrl) => {
  try {
    console.log(`[PDF ${pdfId}] Starting processing...`);

    await Pdf.findByIdAndUpdate(pdfId, {
      status: "processing",
      errorMessage: null,
    });

    const result = await withKeyRotation(async (genAI) => {
      const embeddingModel = genAI.getGenerativeModel({
        model: "embedding-001",
      });

      try {
        console.log(`[PDF ${pdfId}] Downloading from: ${fileUrl}`);

        const response = await axios.get(fileUrl, {
          responseType: "arraybuffer",
          timeout: 120000, // 2 minute timeout
          maxContentLength: 50 * 1024 * 1024, // 50MB max
        });

        const dataBuffer = Buffer.from(response.data);
        console.log(`[PDF ${pdfId}] Downloaded ${dataBuffer.length} bytes`);

        console.log(`[PDF ${pdfId}] Parsing PDF...`);
        const data = await pdfParse(dataBuffer);
        const text = data.text;
        const totalPages = data.numpages;

        console.log(
          `[PDF ${pdfId}] Parsed: ${totalPages} pages, ${text.length} chars`
        );

        if (!text || text.trim().length < 100) {
          throw new Error(
            "PDF contains insufficient text content. Please ensure the PDF has readable text."
          );
        }

        const chunks = chunkTextWithPages(text, totalPages);
        console.log(`[PDF ${pdfId}] Created ${chunks.length} chunks`);

        const batchSize = 50; // Reduced batch size for stability
        const allEmbeddings = [];

        for (let i = 0; i < chunks.length; i += batchSize) {
          const batch = chunks.slice(i, i + batchSize);
          const batchNum = Math.floor(i / batchSize) + 1;
          const totalBatches = Math.ceil(chunks.length / batchSize);

          console.log(
            `[PDF ${pdfId}] Processing batch ${batchNum}/${totalBatches}`
          );

          try {
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

            if (i + batchSize < chunks.length) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          } catch (batchError) {
            console.error(
              `[PDF ${pdfId}] Batch ${batchNum} failed:`,
              batchError.message
            );
            throw batchError;
          }
        }

        if (allEmbeddings.length === 0) {
          throw new Error("Failed to create embeddings for PDF content");
        }

        console.log(
          `[PDF ${pdfId}] Saving ${allEmbeddings.length} embeddings to database...`
        );

        await Pdf.findByIdAndUpdate(pdfId, {
          status: "ready",
          chunks: allEmbeddings,
          totalPages: totalPages,
          errorMessage: null,
        });

        console.log(`[PDF ${pdfId}] ✓ Processing completed successfully`);
      } catch (error) {
        throw error;
      }
    });
  } catch (error) {
    console.error(`[PDF ${pdfId}] ✗ Processing failed:`, error.message);
    console.error(error.stack);

    let errorMessage = "Failed to process PDF";

    if (error.message.includes("quota") || error.message.includes("exceeded")) {
      errorMessage = "API quota exceeded. Please try again later.";
    } else if (error.message.includes("timeout")) {
      errorMessage = "PDF processing timed out. File may be too large.";
    } else if (error.message.includes("insufficient text")) {
      errorMessage = error.message;
    } else if (
      error.message.includes("ENOTFOUND") ||
      error.message.includes("network")
    ) {
      errorMessage = "Network error. Please check your connection.";
    } else {
      errorMessage = `Processing error: ${error.message}`;
    }

    await Pdf.findByIdAndUpdate(pdfId, {
      status: "error",
      errorMessage: errorMessage,
    });
  }
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

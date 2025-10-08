const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();

connectDB();

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://your-frontend.onrender.com",
  "https://student-revision-app.onrender.com",
  "https://student-revision-app.netlify.app",
];

// CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/pdfs", require("./routes/pdfRoutes"));
app.use("/api/quiz", require("./routes/quizRoutes"));
app.use("/api/chats", require("./routes/chatRoutes"));
app.use("/api/youtube", require("./routes/youtubeRoutes"));

app.get("/", (req, res) => {
  res.send(" Backend is running successfully on Render!");
});

app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({ message: err.message || "Server Error" });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(` Server started on port ${PORT}`));

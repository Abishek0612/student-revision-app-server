const express = require("express");
const dotenv = require("dotenv").config();
const cors = require("cors");
const connectDB = require("./config/db");

const port = process.env.PORT || 5001;

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/pdfs", require("./routes/pdfRoutes"));
app.use("/api/quiz", require("./routes/quizRoutes"));
app.use("/api/chats", require("./routes/chatRoutes"));
app.use("/api/youtube", require("./routes/youtubeRoutes"));

app.listen(port, () => console.log(`Server started on port ${port}`));

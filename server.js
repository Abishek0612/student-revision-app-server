const express = require("express");
const dotenv = require("dotenv").config();
const cors = require("cors");
const connectDB = require("./config/db");
const path = require("path");

const port = process.env.PORT || 5000;

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/pdfs", require("./routes/pdfRoutes"));
app.use("/api/quiz", require("./routes/quizRoutes"));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.listen(port, () => console.log(`Server started on port ${port}`));

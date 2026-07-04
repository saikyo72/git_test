const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const routes = require("./routes");
const path = require("path");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve uploaded files
const uploadDir = process.env.UPLOAD_DIR || "uploads";
app.use("/uploads", express.static(uploadDir));

app.use("/api", routes);

// serve frontend app
app.use("/app", express.static(path.join(__dirname, "../public/app")));

app.get("/", (req, res) => res.json({ service: "ClassPay", status: "ok" }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;

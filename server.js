const express = require("express");
const fetch = require("node-fetch");
const bodyParser = require("body-parser");
const path = require("path");
const url = require("url");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ========= Generate filename otomatis =========
function generateFileName(originalName, contentType) {
  let ext = "";
  if (originalName && originalName.includes(".")) {
    ext = "." + originalName.split(".").pop().split("?")[0].split("#")[0];
  } else if (contentType) {
    if (contentType.includes("mp4")) ext = ".mp4";
    else if (contentType.includes("webm")) ext = ".webm";
    else if (contentType.includes("ogg")) ext = ".ogg";
    else if (contentType.includes("mkv")) ext = ".mkv";
    else ext = ".bin";
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `video-${stamp}${ext}`;
}

// ========= Logging ke database =========
async function logDownloadToDB({ ip, videoUrl, filename, userAgent, status }) {
  try {
    await pool.query(
      `
      INSERT INTO downloads (ip, video_url, filename, user

const axios = require("axios");
const express = require("express");

const app = express();

const PORT = process.env.PORT || 4000;
const ELASTIC_URL =
  process.env.ELASTIC_URL || "http://search-engine:9200";

console.log("Search service running on port", PORT);
console.log("Elasticsearch URL:", ELASTIC_URL);

/* =========================
   SEARCH API (ROBUST VERSION)
========================= */
app.get("/search", async (req, res) => {
  try {
    const query = req.query.q || "";

    if (!query) {
      return res.json({
        message: "Please provide search query ?q="
      });
    }

    const response = await axios.post(
      `${ELASTIC_URL}/search/_search`,
      {
        query: {
          multi_match: {
            query: query,
            fields: ["title", "category"]
          }
        }
      }
    );

    res.json(response.data);
  } catch (err) {
    console.log("ERROR:", err.response?.data || err.message);

    res.status(500).json({
      error: "Search failed",
      details: err.response?.data || err.message
    });
  }
});

/* =========================
   HEALTH CHECK
========================= */
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
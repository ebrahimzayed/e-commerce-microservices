const axios = require("axios");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 4000;
const ELASTIC_URL = process.env.ELASTIC_URL || "http://search-engine:9200";
const PRODUCTS_URL = process.env.PRODUCTS_URL || "http://products-service:5000";
console.log("Search service running on port", PORT);
console.log("Elasticsearch URL:", ELASTIC_URL);

const indexProducts = async () => {
  try {
    let count = 0;
    try {
      const countRes = await axios.get(`${ELASTIC_URL}/search/_count`);
      count = countRes.data.count;
    } catch (e) { count = 0; }
    if (count > 0) {
      console.log(`Index already has ${count} documents. Skipping.`);
      return;
    }
    console.log("Index is empty. Fetching products...");
    const productsRes = await axios.get(`${PRODUCTS_URL}/products`);
    const products = productsRes.data;
    for (const p of products) {
      await axios.put(`${ELASTIC_URL}/search/_doc/${p.id}`, {
        title: p.title,
        category: p.category,
        description: p.description,
        price: p.price,
        sku: p.sku,
        thumbnail: p.thumbnail
      });
    }
    console.log("Indexing complete!");
  } catch (err) {
    console.log("Indexing failed:", err.response?.data || err.message);
    setTimeout(indexProducts, 10000);
  }
};

app.get("/search", async (req, res) => {
  try {
    const query = req.query.q || "";
    if (!query) {
      return res.json({ message: "Please provide search query ?q=" });
    }
    const response = await axios.post(
      `${ELASTIC_URL}/search/_search`,
      {
        query: {
          bool: {
            should: [
              {
                multi_match: {
                  query: query,
                  fields: ["title^3", "category^2", "description"],
                  fuzziness: "AUTO"
                }
              },
              {
                wildcard: { title: { value: `*${query.toLowerCase()}*`, boost: 2 } }
              },
              {
                wildcard: { category: { value: `*${query.toLowerCase()}*`, boost: 1 } }
              },
              {
                wildcard: { description: { value: `*${query.toLowerCase()}*` } }
              }
            ]
          }
        }
      }
    );
    res.json(response.data);
  } catch (err) {
    console.log("ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "Search failed", details: err.response?.data || err.message });
  }
});

app.get("/reindex", async (req, res) => {
  await indexProducts();
  res.json({ message: "Reindex triggered" });
});

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  setTimeout(indexProducts, 5000);
});

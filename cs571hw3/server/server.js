// server/server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fetch = require("node-fetch");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// ✅ Simple test route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/search", async (req, res) => {
  const { keyword, latlong, radius } = req.query;
  const apiKey = process.env.TICKETMASTER_API_KEY;

  // For Los Angeles coordinates, use corresponding GeoHash
  const geoPoint = "9q5ctr"; // LA geohash
  const dmaId = "324";       // also LA market ID

  const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&keyword=${encodeURIComponent(
    keyword
  )}&geoPoint=${geoPoint}&dmaId=${dmaId}&radius=${radius}&unit=miles&countryCode=US`;

  console.log("➡️ Fetching from:", url);

  try {
    const response = await fetch(url);
    const text = await response.text();

    if (!response.ok) {
      console.error("❌ Ticketmaster API error:", text);
      return res.status(response.status).json({
        error: "Ticketmaster API error",
        detail: text,
      });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("❌ Invalid JSON from Ticketmaster:", text);
      return res.status(500).json({ error: "Invalid JSON response from Ticketmaster" });
    }

    if (!data._embedded || !data._embedded.events) {
      console.warn("⚠️ No events found for query");
      return res.json({ events: [] });
    }

    console.log(`✅ Found ${data._embedded.events.length} events`);
    res.json(data._embedded.events);
  } catch (err) {
    console.error("❌ Internal server error:", err.message);
    res.status(500).json({ error: "Internal Server Error", detail: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));

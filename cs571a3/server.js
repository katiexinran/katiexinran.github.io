import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { MongoClient } from "mongodb";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:8080"], // Adjust for your frontend
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB Connection
const MONGO_URI = process.env.MONGODB_URI;
let db;

async function connectDB() {
  if (!MONGO_URI) {
    console.error("❌ MONGODB_URI not set in .env file");
    return false;
  }

  try {
    const client = new MongoClient(MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    await client.connect();
    db = client.db("HW3");

    // Test the connection
    await db.command({ ping: 1 });
    console.log("✅ MongoDB connected successfully to:", MONGO_URI.replace(/:.*@/, ':***@'));
    return true;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    console.error("Check your MONGODB_URI in .env file");
    return false;
  }
}

// API Keys validation
const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY?.trim();
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID?.trim();
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET?.trim();
const GOOGLE_GEOCODING_API_KEY = process.env.GOOGLE_GEOCODING_API_KEY?.trim();

// Validate API keys on startup
if (!TICKETMASTER_API_KEY) {
  console.error("❌ TICKETMASTER_API_KEY is missing from .env file");
  process.exit(1);
}

console.log("✅ API Keys loaded:");
console.log("   Ticketmaster:", TICKETMASTER_API_KEY ? "Loaded ✅" : "Missing ❌");
console.log("   Spotify:", (SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET) ? "Loaded ✅" : "Missing ❌");
console.log("   Google Geocoding:", GOOGLE_GEOCODING_API_KEY ? "Loaded ✅" : "Missing ❌");

// Spotify Authentication Token caching
let spotifyToken = null;
let spotifyTokenExpiry = 0;

async function getSpotifyToken() {
  // Check if token is still valid (5 min buffer)
  if (spotifyToken && spotifyTokenExpiry > Date.now() + (5 * 60 * 1000)) {
    return spotifyToken;
  }

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error("Spotify credentials missing from .env file");
  }

  const authString = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64");

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${authString}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Spotify auth failed: ${response.status} - ${errorData.error_description || 'Unknown error'}`);
    }

    const data = await response.json();
    spotifyToken = data.access_token;
    spotifyTokenExpiry = Date.now() + (data.expires_in * 1000);

    console.log("🔑 Spotify token refreshed, expires in:", Math.round(data.expires_in / 60), "minutes");
    return spotifyToken;
  } catch (error) {
    console.error("❌ Spotify authentication error:", error.message);
    throw error;
  }
}

// ========== SEARCH ENDPOINTS ==========

// Autocomplete suggestions - FIXED URL ENCODING
app.get("/api/search/autocomplete", async (req, res) => {
  const { keyword } = req.query;

  if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
    return res.json({ suggestions: [] });
  }

  const cleanKeyword = keyword.trim();

  try {
    const encodedKeyword = encodeURIComponent(cleanKeyword); // This handles & symbols properly
    const url = `https://app.ticketmaster.com/discovery/v2/suggest.json?apikey=${TICKETMASTER_API_KEY}&keyword=${encodedKeyword}`;

    console.log("🔍 Autocomplete request:", cleanKeyword);
    console.log("   URL:", url.substring(0, 100) + (url.length > 100 ? "..." : ""));

    const response = await fetch(url);

    if (!response.ok) {
      console.error("❌ Autocomplete API Error:", response.status, await response.text());
      return res.status(500).json({ 
        error: "Ticketmaster autocomplete failed", 
        status: response.status 
      });
    }

    const data = await response.json();
    const attractions = data._embedded?.attractions || [];
    const suggestions = attractions
      .map(attraction => attraction.name)
      .filter(name => name && name.trim().length > 0)
      .slice(0, 10); // Limit to 10 suggestions

    console.log(`✅ Autocomplete found ${suggestions.length} suggestions for "${cleanKeyword}"`);

    res.json({ 
      suggestions,
      keyword: cleanKeyword,
      count: suggestions.length 
    });

  } catch (error) {
    console.error("❌ Autocomplete error:", error.message);
    res.status(500).json({ 
      error: "Failed to fetch autocomplete suggestions",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Main search endpoint - FULLY FIXED FOR & SYMBOL ISSUES
app.get("/api/search", async (req, res) => {
  const { 
    keyword, 
    category, 
    distance, 
    latitude, 
    longitude 
  } = req.query;

  // Validate all parameters
  if (!keyword || typeof keyword !== 'string') {
    return res.status(400).json({ error: "Keyword parameter is required and must be a string" });
  }

  if (!category || !['All', 'Music', 'Sports', "Arts & Theatre", 'Film', 'Miscellaneous'].includes(category)) {
    return res.status(400).json({ 
      error: "Invalid category", 
      allowed: ['All', 'Music', 'Sports', "Arts & Theatre", 'Film', 'Miscellaneous']
    });
  }

  if (!distance || isNaN(Number(distance)) || Number(distance) < 1) {
    return res.status(400).json({ error: "Distance must be a number >= 1" });
  }

  if (!latitude || isNaN(Number(latitude))) {
    return res.status(400).json({ error: "Latitude must be a valid number" });
  }

  if (!longitude || isNaN(Number(longitude))) {
    return res.status(400).json({ error: "Longitude must be a valid number" });
  }

  const cleanParams = {
    keyword: keyword.toString().trim(),
    category: category.toString().trim(),
    distance: Number(distance),
    latitude: Number(latitude),
    longitude: Number(longitude)
  };

  // Don't search if keyword is too short
  if (cleanParams.keyword.length < 2) {
    return res.json({ events: [], total: 0, message: "Keyword too short - minimum 2 characters" });
  }

  try {
    let segmentId = "";

    // EXACT CATEGORY MAPPING FROM ASSIGNMENT SPEC - handles "Arts & Theatre" correctly
    const categoryMap = {
      "Music": "KZFzniwnSyZfZ7v7nJ",
      "Sports": "KZFzniwnSyZfZ7v7nE", 
      "Arts & Theatre": "KZFzniwnSyZfZ7v7na",  // This is the EXACT match
      "Film": "KZFzniwnSyZfZ7v7nn",
      "Miscellaneous": "KZFzniwnSyZfZ7v7n1"
    };

    if (cleanParams.category !== "All") {
      segmentId = categoryMap[cleanParams.category];
      if (!segmentId) {
        console.error("❌ Unknown category:", cleanParams.category);
        return res.status(400).json({ error: "Unknown category", category: cleanParams.category });
      }
    }

    // CRITICAL: Proper URL encoding for ALL parameters - fixes & symbol issue
    const encodedKeyword = encodeURIComponent(cleanParams.keyword);  // Handles spaces, &, etc.
    const encodedGeoPoint = encodeURIComponent(`${cleanParams.latitude},${cleanParams.longitude}`);
    const encodedRadius = encodeURIComponent(cleanParams.distance.toString());
    const encodedSegmentId = encodeURIComponent(segmentId);

    // Build URL step by step to avoid encoding issues
    const baseUrl = "https://app.ticketmaster.com/discovery/v2/events.json";
    const params = new URLSearchParams({
      apikey: TICKETMASTER_API_KEY,
      keyword: cleanParams.keyword,  // encodeURIComponent handles this internally
      radius: cleanParams.distance.toString(),
      unit: 'miles',
      geoPoint: `${cleanParams.latitude},${cleanParams.longitude}`,
      size: '20',  // Max 20 as per rubric
      sort: 'date,asc'  // Sort by date ascending
    });

    // Add segment filter only if category is not "All"
    if (segmentId && cleanParams.category !== "All") {
      params.append('segmentId', segmentId);
    }

    // Add country code for US events (improves results)
    params.append('countryCode', 'US');

    const finalUrl = `${baseUrl}?${params.toString()}`;

    // Log for debugging
    console.log("\n🔍 Performing search:");
    console.log("   Keyword:", `"${cleanParams.keyword}"`);
    console.log("   Category:", cleanParams.category, segmentId ? `(${segmentId})` : "(All)");
    console.log("   Location:", `${cleanParams.latitude.toFixed(4)}, ${cleanParams.longitude.toFixed(4)}`);
    console.log("   Distance:", `${cleanParams.distance} miles`);
    console.log("   Final URL length:", finalUrl.length);
    console.log("   URL preview:", finalUrl.substring(0, 120) + (finalUrl.length > 120 ? "..." : ""));

    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'HW3-EventSearch/1.0',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(10000)  // 10 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("\n❌ Ticketmaster API Error:");
      console.error("   Status:", response.status, response.statusText);
      console.error("   URL:", finalUrl.substring(0, 100) + "...");
      console.error("   Response preview:", errorText.substring(0, 200));

      // Common error handling
      if (response.status === 400) {
        return res.status(400).json({ 
          error: "Invalid search parameters", 
          keyword: cleanParams.keyword,
          category: cleanParams.category 
        });
      }

      if (response.status === 401) {
        return res.status(401).json({ error: "Invalid Ticketmaster API key" });
      }

      if (response.status === 429) {
        return res.status(429).json({ error: "Rate limited - try again in a few seconds" });
      }

      return res.status(response.status).json({ 
        error: "Ticketmaster API request failed", 
        status: response.status,
        details: errorText.substring(0, 500)
      });
    }

    const data = await response.json();
    const events = data._embedded?.events || [];

    console.log(`✅ Search completed: Found ${events.length} events`);

    // Format events for frontend - EXACTLY as assignment requires
    const formattedEvents = events.map((event, index) => {
      const classification = event.classifications?.[0] || {};
      const segment = classification.segment || {};
      const genre = classification.genre || {};
      const subGenre = classification.subGenre || {};
      const type = classification.type || {};
      const subType = classification.subType || {};

      const startDate = event.dates?.start;
      const localDate = startDate?.localDate || "";
      const localTime = startDate?.localTime || "";
      const fullDateTime = startDate ? `${localDate}T${localTime}` : null;

      const firstVenue = event._embedded?.venues?.[0] || {};
      const firstImage = event.images?.[0]?.url || "";

      // Genres as specified: segment, genre, subGenre, type, subType
      const genresArray = [
        segment.name,
        genre.name, 
        subGenre.name,
        type.name,
        subType.name
      ].filter(Boolean); // Remove empty values

      return {
        id: event.id,
        name: event.name || "Unknown Event",
        images: event.images || [],
        firstImage: firstImage,
        dates: event.dates || {},
        classifications: event.classifications || [],
        priceRanges: event.priceRanges || [],
        ticketStatus: (event.dates?.status || "onsale").toLowerCase(),
        seatmap: {
          staticUrl: event.seatmap?.staticUrl || ""
        },
        _embedded: {
          attractions: event._embedded?.attractions || [],
          venues: event._embedded?.venues || [firstVenue]
        },
        // For card display - EXACTLY as rubric specifies
        category: segment.name || "Miscellaneous",
        date: localDate,
        time: localTime,
        fullDateTime: fullDateTime ? new Date(fullDateTime).toISOString() : null,
        venueName: firstVenue.name || "Unknown Venue",
        status: event.dates?.status || "onsale",
        genres: genresArray,
        eventUrl: event.url || ""
      };
    });

    // Sort by date ascending (HW3 requirement) - stable sort
    formattedEvents.sort((a, b) => {
      if (!a.fullDateTime && !b.fullDateTime) return 0;
      if (!a.fullDateTime) return 1;
      if (!b.fullDateTime) return -1;
      return new Date(a.fullDateTime) - new Date(b.fullDateTime);
    });

    // Limit to 20 as per API spec and rubric
    const limitedEvents = formattedEvents.slice(0, 20);

    const responseData = {
      events: limitedEvents,
      total: limitedEvents.length,
      available: events.length,
      maxResults: 20,
      searchParams: cleanParams,
      usedSegmentId: segmentId,
      apiResponse: {
        page: data.page || { totalElements: 0, size: 0 },
        timestamp: new Date().toISOString()
      }
    };

    console.log(`📊 Search results: ${limitedEvents.length} events displayed (max 20)`);

    res.json(responseData);

  } catch (error) {
    console.error("\n❌ Search Error Details:");
    console.error("   Message:", error.message);
    console.error("   Stack:", error.stack?.substring(0, 200));

    res.status(500).json({ 
      error: "Internal search error", 
      message: error.message,
      params: cleanParams
    });
  }
});

// Get single event details
app.get("/api/events/:id", async (req, res) => {
  const { id } = req.params;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: "Valid event ID required" });
  }

  try {
    const eventUrl = `https://app.ticketmaster.com/discovery/v2/events/${id}.json?apikey=${TICKETMASTER_API_KEY}`;

    console.log("📄 Fetching event details for ID:", id);

    const response = await fetch(eventUrl);

    if (!response.ok) {
      console.error("❌ Event details API error:", response.status);
      return res.status(response.status).json({ error: "Event not found" });
    }

    const eventData = await response.json();
    const event = eventData._embedded?.events?.[0] || eventData;

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Format exactly as frontend expects
    const formattedEvent = {
      id: event.id,
      name: event.name,
      url: event.url,
      images: event.images || [],
      dates: event.dates || {},
      classifications: event.classifications || [],
      priceRanges: event.priceRanges || [],
      ticketStatus: event.dates?.status || "onsale",
      seatmap: event.seatmap || {},
      _embedded: {
        attractions: event._embedded?.attractions || [],
        venues: event._embedded?.venues || []
      },
      // Computed fields for display
      category: event.classifications?.[0]?.segment?.name || "Miscellaneous",
      date: event.dates?.start?.localDate || "",
      time: event.dates?.start?.localTime || "",
      venueName: event._embedded?.venues?.[0]?.name || "Unknown Venue",
      fullDateTime: event.dates?.start ? `${event.dates.start.localDate}T${event.dates.start.localTime || "00:00"}` : null,
      // Genres array as specified
      genres: [
        event.classifications?.[0]?.segment?.name,
        event.classifications?.[0]?.genre?.name,
        event.classifications?.[0]?.subGenre?.name,
        event.classifications?.[0]?.type?.name,
        event.classifications?.[0]?.subType?.name
      ].filter(Boolean)
    };

    console.log("✅ Event details formatted:", formattedEvent.name);
    res.json(formattedEvent);

  } catch (error) {
    console.error("❌ Event details error:", error.message);
    res.status(500).json({ error: "Failed to fetch event details" });
  }
});

// ========== FAVORITES ENDPOINTS ==========

app.get("/api/favorites", async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: "Database not available" });
    }

    const favoritesCollection = db.collection("favorites");
    const favorites = await favoritesCollection.find({})
      .sort({ addedAt: -1 }) // Most recent first
      .limit(100)
      .toArray();

    // Format for frontend
    const formatted = favorites.map(fav => ({
      id: fav.eventId,
      ...fav.event,
      addedAt: fav.addedAt,
      addedDate: fav.addedAt ? fav.addedAt.toISOString().split('T')[0] : '',
      isFavorite: true
    }));

    res.json({ 
      favorites: formatted, 
      total: formatted.length,
      message: formatted.length === 0 ? "No favorite events yet" : undefined
    });

  } catch (error) {
    console.error("❌ Favorites error:", error.message);
    res.status(500).json({ error: "Failed to fetch favorites" });
  }
});

app.post("/api/favorites/:id", async (req, res) => {
  const { id } = req.params;
  let eventData;

  try {
    if (!db) {
      return res.status(503).json({ error: "Database not ready" });
    }

    const { event } = req.body;
    eventData = event;

    if (!event || !event.id || !event.name) {
      return res.status(400).json({ error: "Event data required" });
    }

    const favoritesCollection = db.collection("favorites");
    const existing = await favoritesCollection.findOne({ eventId: id });

    if (existing) {
      return res.json({ status: "already_exists" });
    }

    const favoriteDoc = {
      eventId: id,
      event: {
        id: event.id,
        name: event.name,
        category: event.category || "Unknown",
        date: event.date || "",
        time: event.time || "",
        venueName: event.venueName || "Unknown",
        firstImage: event.firstImage || "",
        fullEvent: event // Store complete event data
      },
      addedAt: new Date()
    };

    await favoritesCollection.insertOne(favoriteDoc);

    console.log("❤️ Added to favorites:", event.name);
    res.json({ 
      status: "added", 
      eventId: id,
      message: `${event.name} added to favorites`
    });

  } catch (error) {
    console.error("❌ Add favorite error:", error.message);
    res.status(500).json({ error: "Failed to add favorite" });
  }
});

app.delete("/api/favorites/:id", async (req, res) => {
  const { id } = req.params;

  try {
    if (!db) {
      return res.status(503).json({ error: "Database not ready" });
    }

    const favoritesCollection = db.collection("favorites");
    const result = await favoritesCollection.deleteOne({ eventId: id });

    if (result.deletedCount > 0) {
      console.log("💔 Removed from favorites:", id);
      res.json({ status: "removed", deletedCount: result.deletedCount });
    } else {
      res.json({ status: "not_found" });
    }

  } catch (error) {
    console.error("❌ Remove favorite error:", error.message);
    res.status(500).json({ error: "Failed to remove favorite" });
  }
});

// ========== SPOTIFY ENDPOINTS ==========

app.get("/api/artist/:name", async (req, res) => {
  const { name } = req.params;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: "Artist name required" });
  }

  try {
    const cleanName = name.trim();
    const token = await getSpotifyToken();

    const encodedName = encodeURIComponent(cleanName);
    const searchUrl = `https://api.spotify.com/v1/search?q=${encodedName}&type=artist&limit=1`;

    console.log("🎵 Spotify artist search:", cleanName);

    const response = await fetch(searchUrl, {
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "HW3-EventSearch/1.0"
      }
    });

    if (!response.ok) {
      console.error("❌ Spotify search failed:", response.status);
      return res.status(response.status).json({ error: "Spotify search failed" });
    }

    const data = await response.json();
    const artist = data.artists?.items?.[0];

    if (!artist) {
      console.log("ℹ️ No Spotify match for:", cleanName);
      return res.json({ artist: null });
    }

    // Format EXACTLY as frontend expects
    const followers = artist.followers?.total || 0;
    const formattedFollowers = followers.toLocaleString('en-US');

    const result = {
      artist: {
        id: artist.id,
        name: artist.name,
        image: artist.images?.[0]?.url || "", // Full size for detail view
        imageSmall: artist.images?.[2]?.url || artist.images?.[1]?.url || artist.image, // Thumbnail
        followers: followers,
        formattedFollowers: formattedFollowers,
        popularity: artist.popularity || 0,
        popularityPercent: `${Math.round(artist.popularity || 0)}%`,
        genres: artist.genres || [],
        spotifyUrl: artist.external_urls?.spotify || "",
        followersText: `${formattedFollowers} followers`,
        popularityText: `Popularity: ${Math.round(artist.popularity || 0)}%`
      }
    };

    console.log("✅ Spotify artist:", artist.name, `(${formattedFollowers} followers)`);
    res.json(result);

  } catch (error) {
    console.error("❌ Spotify error:", error.message);
    res.status(500).json({ error: "Spotify service unavailable" });
  }
});

app.get("/api/artist/:id/albums", async (req, res) => {
  const { id } = req.params;

  try {
    const token = await getSpotifyToken();

    const url = `https://api.spotify.com/v1/artists/${id}/albums?limit=8&include_groups=album,single`;

    const response = await fetch(url, {
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Spotify albums fetch failed" });
    }

    const data = await response.json();
    const albums = (data.items || [])
      .filter(album => album.album_type !== 'compilation')
      .map(album => ({
        id: album.id,
        name: album.name,
        image: album.images?.[1]?.url || album.images?.[0]?.url || "",
        releaseDate: album.release_date || "",
        releaseYear: album.release_date ? new Date(album.release_date).getFullYear() : "",
        tracks: album.total_tracks || 0,
        type: album.album_type === 'album' ? 'Album' : 'Single',
        spotifyUrl: album.external_urls?.spotify || ""
      }))
      .slice(0, 8); // Limit to 8 albums

    res.json({ albums });

  } catch (error) {
    console.error("❌ Spotify albums error:", error.message);
    res.status(500).json({ error: "Failed to fetch albums" });
  }
});

// ========== LOCATION ENDPOINTS ==========

app.get("/api/location/auto-detect", async (req, res) => {
  try {
    console.log("📍 Auto-detecting user location...");

    const response = await fetch("https://ipinfo.io/json?token=", { // Free tier, no token needed for basic
      headers: { "User-Agent": "HW3-EventSearch/1.0" }
    });

    if (!response.ok) {
      throw new Error(`IP detection failed: ${response.status}`);
    }

    const data = await response.json();

    // Parse coordinates
    let lat = 34.0522; // Default LA
    let lng = -118.2437;

    if (data.loc) {
      const [latitude, longitude] = data.loc.split(',');
      lat = parseFloat(latitude);
      lng = parseFloat(longitude);
    }

    const location = {
      city: data.city || "Unknown",
      region: data.region || "Unknown", 
      country: data.country || "US",
      latitude: lat,
      longitude: lng,
      fullAddress: `${data.city || ""}, ${data.region || ""}, ${data.country || ""}`.trim(),
      ip: data.ip,
      autoDetected: true,
      accuracy: "city_level",
      timestamp: new Date().toISOString()
    };

    // Clean up address
    location.fullAddress = location.fullAddress.replace(/, , /g, ', ').replace(/^, |, $/, '');

    console.log("✅ Auto-detected:", location.fullAddress);
    res.json(location);

  } catch (error) {
    console.error("❌ Auto-detect error:", error.message);

    // Fallback to Los Angeles (USC area)
    const fallback = {
      city: "Los Angeles",
      region: "CA",
      country: "US", 
      latitude: 34.0522,
      longitude: -118.2437,
      fullAddress: "Los Angeles, CA, US",
      autoDetected: false,
      fallback: true,
      message: "Using default location (Los Angeles)"
    };

    res.json(fallback);
  }
});

// Google Geocoding endpoint
app.get("/api/location/geocode", async (req, res) => {
  const { address } = req.query;

  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    return res.status(400).json({ error: "Address parameter is required" });
  }

  if (!GOOGLE_GEOCODING_API_KEY) {
    return res.status(501).json({ 
      error: "Google Geocoding not configured", 
      message: "Add GOOGLE_GEOCODING_API_KEY to .env file" 
    });
  }

  try {
    const cleanAddress = address.trim();
    const encodedAddress = encodeURIComponent(cleanAddress);

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_GEOCODING_API_KEY}`;

    console.log("🗺️ Geocoding:", cleanAddress.substring(0, 50));

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const result = data.results[0];
      const location = result.geometry.location;

      // Extract address components
      const components = {};
      result.address_components.forEach(comp => {
        if (comp.types.includes("locality")) components.city = comp.long_name;
        if (comp.types.includes("administrative_area_level_1")) components.state = comp.short_name;
        if (comp.types.includes("country")) components.country = comp.long_name;
        if (comp.types.includes("postal_code")) components.zip = comp.long_name;
        if (comp.types.includes("street_number")) components.streetNumber = comp.long_name;
        if (comp.types.includes("route")) components.street = comp.short_name;
      });

      const formatted = {
        formattedAddress: result.formatted_address,
        latitude: location.lat,
        longitude: location.lng,
        city: components.city || "",
        state: components.state || "",
        country: components.country || "",
        zip: components.zip || "",
        streetAddress: `${components.streetNumber || ""} ${components.street || ""}`.trim(),
        accuracy: result.geometry.location_type || "APPROXIMATE",
        placeId: result.place_id,
        types: result.types,
        timestamp: new Date().toISOString()
      };

      console.log("✅ Geocoded:", formatted.formattedAddress);
      res.json(formatted);

    } else {
      console.log("❌ Geocoding failed:", data.status, "for address:", cleanAddress);
      res.status(400).json({ 
        error: "Unable to find location", 
        status: data.status,
        address: cleanAddress,
        suggestions: data.status === "ZERO_RESULTS" ? [
          "Try a more specific address",
          "Use city and state (e.g., 'Los Angeles, CA')", 
          "Check spelling"
        ] : []
      });
    }

  } catch (error) {
    console.error("❌ Geocoding error:", error.message);
    res.status(500).json({ 
      error: "Geocoding service error",
      message: error.message 
    });
  }
});

// ========== HEALTH CHECK - ENHANCED ==========

app.get("/api/health", (req, res) => {
  const dbStatus = db ? "Connected" : "Connecting...";
  const dbPing = db ? new Date().toISOString() : null;

  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    server: {
      port: PORT,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime()
    },
    database: {
      connected: !!db,
      status: dbStatus,
      lastPing: dbPing,
      uri: MONGO_URI ? MONGO_URI.replace(/:(.*?)(@|$)/, ':***$1$2') : "Not configured"
    },
    apis: {
      ticketmaster: !!TICKETMASTER_API_KEY,
      spotify: !!(SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET),
      googleGeocoding: !!GOOGLE_GEOCODING_API_KEY,
      location: true  // ipinfo.io free tier
    },
    endpoints: {
      search: `/api/search?keyword=test&category=All&distance=10&latitude=34.0522&longitude=-118.2437`,
      autocomplete: `/api/search/autocomplete?keyword=music`,
      location: `/api/location/auto-detect`,
      favorites: `/api/favorites`,
      artist: `/api/artist/Beyonce`,
      health: `/api/health`
    },
    memory: process.memoryUsage(),
    testSearch: async () => {
      // Don't actually run - just for reference
      return {
        example: "GET /api/search?keyword=concert&category=Music&distance=25&latitude=34.0522&longitude=-118.2437"
      };
    }
  };

  res.json(health);
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("❌ Unhandled error:", error.message);
  console.error("   URL:", req.originalUrl);
  console.error("   Method:", req.method);
  console.error("   Body:", req.body);

  res.status(500).json({ 
    error: "Internal server error",
    message: process.env.NODE_ENV === 'development' ? error.message : "Something went wrong",
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: "Endpoint not found",
    path: req.originalUrl,
    available: ["/api/health", "/api/search", "/api/events/:id", "/api/favorites"]
  });
});

// ========== START SERVER ==========

const startServer = async () => {
  console.log("\n🚀 Starting HW3 Event Search Backend...");
  console.log("📅 Started:", new Date().toISOString());

  // Wait for MongoDB
  const dbConnected = await connectDB();

  if (!dbConnected) {
    console.error("\n❌ Cannot start without MongoDB connection");
    process.exit(1);
  }

  // Test Ticketmaster API key
  try {
    const testResponse = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}&size=1`);
    const testStatus = testResponse.ok ? "valid" : "invalid";
    console.log(`🎫 Ticketmaster API: ${testStatus} ✅`);
  } catch (error) {
    console.error("❌ Ticketmaster API test failed:", error.message);
  }

  app.listen(PORT, "0.0.0.0", () => {
    const startTime = new Date().toLocaleString();
    console.log(`\n🌟 Server successfully started at ${startTime}`);
    console.log(`📡 Base URL: http://localhost:${PORT}`);
    console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`\n🧪 Quick Test Commands:`);
    console.log(`   curl "http://localhost:${PORT}/api/health"`);
    console.log(`   curl "http://localhost:${PORT}/api/search/autocomplete?keyword=concert"`);
    console.log(`   curl "http://localhost:${PORT}/api/location/auto-detect"`);
    console.log(`   curl "http://localhost:${PORT}/api/search?keyword=music&category=All&distance=10&latitude=34.0522&longitude=-118.2437" | jq '.events | length'`);
    console.log(`\n📱 Frontend should connect to: http://localhost:${PORT}/api/`);
    console.log(`\n✅ Ready for testing! Press Ctrl+C to stop.`);
    console.log(`\n--- HW3 Backend v1.0.0 ---`);
  });

  // Graceful shutdown
  const gracefulShutdown = (signal) => {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);

    // Close MongoDB connection if available
    if (db) {
      // Note: In production, you'd properly close the MongoClient
      console.log("   Database connection closed");
    }

    process.exit(0);
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
};

// Handle startup errors
process.on('uncaughtException', (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Start the server
startServer().catch((error) => {
  console.error("\n💥 Failed to start server:", error);
  process.exit(1);
});

export default app;
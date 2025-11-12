const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const dns = require('dns');
require('dotenv').config();

// Fix DNS resolution issues on Node.js 17+
dns.setDefaultResultOrder('ipv4first');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
let db;
let favoritesCollection;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ticketmaster-app';

async function connectToMongoDB() {
  try {
    console.log('🔄 Attempting to connect to MongoDB Atlas...');
    const client = await MongoClient.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB Atlas');
    db = client.db('hw3');
    favoritesCollection = db.collection('favorites');
    
    // Create index on eventId for faster queries
    await favoritesCollection.createIndex({ eventId: 1 }, { unique: true });
    console.log('✅ Favorites collection initialized');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('📋 Error code:', error.code || 'N/A');
    console.error('📋 Error name:', error.name || 'N/A');
    if (error.message.includes('ECONNREFUSED') || error.message.includes('querySrv')) {
      console.log('💡 Possible solutions:');
      console.log('   1. Whitelist your IP address in MongoDB Atlas Network Access');
      console.log('   2. Check your internet connection');
      console.log('   3. Verify the connection string in .env file');
      console.log('   4. Check if your network/firewall blocks MongoDB Atlas');
    }
    console.log('⚠️  Server will continue without database functionality');
  }
}

connectToMongoDB();

// API Keys from environment variables
const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY;
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const IPINFO_TOKEN = process.env.IPINFO_TOKEN;

// Validate API keys
if (!TICKETMASTER_API_KEY) {
  console.error('❌ TICKETMASTER_API_KEY is not set in environment variables');
}
if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  console.error('❌ Spotify credentials are not set in environment variables');
}
if (!GOOGLE_MAPS_API_KEY) {
  console.error('❌ GOOGLE_MAPS_API_KEY is not set in environment variables');
}

// Spotify token cache
let spotifyToken = null;
let spotifyTokenExpiry = 0;

// Get Spotify Access Token
async function getSpotifyToken() {
  if (spotifyToken && Date.now() < spotifyTokenExpiry) {
    return spotifyToken;
  }

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(
            SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET
          ).toString('base64')
        }
      }
    );

    spotifyToken = response.data.access_token;
    spotifyTokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // Refresh 1 min early
    return spotifyToken;
  } catch (error) {
    console.error('Error getting Spotify token:', error.response?.data || error.message);
    throw error;
  }
}

// ============================================
// API Routes
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    mongodb: db ? 'connected' : 'disconnected'
  });
});

// Event search
app.get('/api/search', async (req, res) => {
  try {
    const { keyword, radius, unit, latlong, segmentId } = req.query;
    
    if (!keyword || !latlong) {
      return res.status(400).json({ error: 'Missing required parameters: keyword and latlong' });
    }
    
    const params = {
      apikey: TICKETMASTER_API_KEY,
      keyword,
      radius: radius || '10',
      unit: unit || 'miles',
      latlong,
      size: 20
    };

    if (segmentId && segmentId !== 'All') {
      params.segmentId = segmentId;
    }

    const response = await axios.get(
      'https://app.ticketmaster.com/discovery/v2/events.json',
      { params }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Event search error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to search events',
      details: error.response?.data?.fault?.faultstring || error.message
    });
  }
});

// Event autocomplete/suggest
app.get('/api/suggest', async (req, res) => {
  try {
    const { keyword } = req.query;
    
    if (!keyword) {
      return res.json({ _embedded: { attractions: [] } });
    }
    
    const response = await axios.get(
      'https://app.ticketmaster.com/discovery/v2/suggest',
      {
        params: {
          apikey: TICKETMASTER_API_KEY,
          keyword
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Suggest error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// Event details
app.get('/api/event_details/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const response = await axios.get(
      `https://app.ticketmaster.com/discovery/v2/events/${id}.json`,
      {
        params: {
          apikey: TICKETMASTER_API_KEY
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Event details error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get event details' });
  }
});

// Spotify artist details
app.get('/api/artist_details', async (req, res) => {
  try {
    const { name } = req.query;
    
    if (!name) {
      return res.status(400).json({ error: 'Artist name is required' });
    }
    
    const token = await getSpotifyToken();

    // Search for artist
    const artistResponse = await axios.get(
      'https://api.spotify.com/v1/search',
      {
        params: {
          q: name,
          type: 'artist',
          limit: 1
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const artist = artistResponse.data.artists?.items[0];
    if (!artist) {
      return res.json({ artist: null });
    }

    res.json({ artist });
  } catch (error) {
    console.error('Spotify artist error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get artist data' });
  }
});

// Spotify artist albums
app.get('/api/artist_albums', async (req, res) => {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Artist ID is required' });
    }
    
    const token = await getSpotifyToken();

    // Get artist's albums
    const albumsResponse = await axios.get(
      `https://api.spotify.com/v1/artists/${id}/albums`,
      {
        params: {
          limit: 3,
          include_groups: 'album',
          market: 'US'
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    res.json({ albums: albumsResponse.data.items });
  } catch (error) {
    console.error('Spotify albums error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get albums' });
  }
});

// Geocoding endpoint (address to coordinates)
app.get('/api/geocode', async (req, res) => {
  try {
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }
    
    if (!GOOGLE_MAPS_API_KEY) {
      return res.status(503).json({ error: 'Google Maps API key not configured' });
    }

    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          address: address,
          key: GOOGLE_MAPS_API_KEY
        }
      }
    );

    if (response.data.results && response.data.results[0]) {
      const { lat, lng } = response.data.results[0].geometry.location;
      res.json({ lat, lng, success: true });
    } else {
      res.status(404).json({ error: 'Location not found', success: false });
    }
  } catch (error) {
    console.error('Geocoding error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to geocode location', success: false });
  }
});

// Reverse geocoding endpoint (coordinates to address)
app.get('/api/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }
    
    if (!GOOGLE_MAPS_API_KEY) {
      return res.status(503).json({ error: 'Google Maps API key not configured' });
    }

    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          latlng: `${lat},${lng}`,
          key: GOOGLE_MAPS_API_KEY
        }
      }
    );

    if (response.data.results && response.data.results[0]) {
      // Extract city from address components
      const result = response.data.results[0];
      const addressComponents = result.address_components;
      
      // Try to find locality (city) first
      let city = addressComponents.find(comp => comp.types.includes('locality'))?.long_name;
      
      // If no locality, try administrative_area_level_3 or administrative_area_level_2
      if (!city) {
        city = addressComponents.find(comp => comp.types.includes('administrative_area_level_3'))?.long_name ||
               addressComponents.find(comp => comp.types.includes('administrative_area_level_2'))?.long_name;
      }
      
      res.json({ 
        city: city || result.formatted_address,
        fullAddress: result.formatted_address,
        success: true 
      });
    } else {
      res.status(404).json({ error: 'Location not found', success: false });
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to reverse geocode location', success: false });
  }
});

// ============================================
// Favorites CRUD Operations
// ============================================

// Get all favorites
app.get('/api/favorites', async (req, res) => {
  try {
    if (!favoritesCollection) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const favorites = await favoritesCollection
      .find({})
      .sort({ addedAt: 1 })
      .toArray();
    
    const eventIds = favorites.map(fav => fav.eventId);
    
    // Fetch full event details for each favorite
    const events = await Promise.all(
      eventIds.map(async (id) => {
        try {
          const response = await axios.get(
            `https://app.ticketmaster.com/discovery/v2/events/${id}.json`,
            {
              params: {
                apikey: TICKETMASTER_API_KEY
              }
            }
          );
          return { ...response.data, _favoriteId: favorites.find(f => f.eventId === id)._id };
        } catch (error) {
          console.error(`Failed to fetch event ${id}:`, error.message);
          return null;
        }
      })
    );

    res.json({ favorites: events.filter(e => e !== null) });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// Add favorite
app.post('/api/favorites', async (req, res) => {
  try {
    const { eventId, eventName } = req.body;
    
    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }
    
    if (!favoritesCollection) {
      return res.status(503).json({ error: 'Database not available' });
    }

    // Check if already exists
    const existing = await favoritesCollection.findOne({ eventId });
    if (existing) {
      return res.json({ success: true, message: 'Already in favorites', _id: existing._id });
    }

    const result = await favoritesCollection.insertOne({
      eventId,
      eventName: eventName || '',
      addedAt: new Date()
    });

    res.json({ success: true, _id: result.insertedId });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

// Remove favorite
app.delete('/api/favorites/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!favoritesCollection) {
      return res.status(503).json({ error: 'Database not available' });
    }

    await favoritesCollection.deleteOne({ eventId: id });
    res.json({ success: true });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

// ============================================
// Serve Frontend Static Files
// ============================================

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// The "catchall" handler: for any request that doesn't
// match an API route, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// ============================================
// Start Server
// ============================================

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api/`);
  console.log(`\n⚙️  Configuration:`);
  console.log(`   - Ticketmaster API: ${TICKETMASTER_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   - Spotify API: ${SPOTIFY_CLIENT_ID ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   - MongoDB: ${db ? '✅ Connected' : '⏳ Connecting...'}`);
  console.log(`\n📝 Make sure your .env file is configured!\n`);
});

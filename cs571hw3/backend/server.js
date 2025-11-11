const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;


// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
let db;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ticketmaster-app';

MongoClient.connect(MONGODB_URI, { useUnifiedTopology: true })
  .then(client => {
    console.log('Connected to MongoDB');
    db = client.db('HW3');
  })
  .catch(error => console.error('MongoDB connection error:', error));

// API Keys from environment variables
const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY;
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

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
    spotifyTokenExpiry = Date.now() + (response.data.expires_in * 1000);
    return spotifyToken;
  } catch (error) {
    console.error('Error getting Spotify token:', error);
    throw error;
  }
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Event search
app.get('/api/events/search', async (req, res) => {
  try {
    const { keyword, radius, unit, latlong, segmentId } = req.query;
    
    const params = {
      apikey: TICKETMASTER_API_KEY,
      keyword,
      radius,
      unit,
      latlong,
      size: 20
    };

    if (segmentId) {
      params.segmentId = segmentId;
    }

    const response = await axios.get(
      'https://app.ticketmaster.com/discovery/v2/events.json',
      { params }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Event search error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to search events' });
  }
});

// Event autocomplete/suggest
app.get('/api/events/suggest', async (req, res) => {
  try {
    const { keyword } = req.query;
    
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
app.get('/api/events/:id', async (req, res) => {
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

// Spotify artist search
app.get('/api/spotify/artist', async (req, res) => {
  try {
    const { name } = req.query;
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
      return res.json({ artist: null, albums: [] });
    }

    // Get artist's albums
    const albumsResponse = await axios.get(
      `https://api.spotify.com/v1/artists/${artist.id}/albums`,
      {
        params: {
          limit: 8,
          include_groups: 'album'
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    res.json({
      artist,
      albums: albumsResponse.data.items
    });
  } catch (error) {
    console.error('Spotify artist error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get artist data' });
  }
});

// Favorites - Get favorites by IDs
app.post('/api/favorites', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || ids.length === 0) {
      return res.json({ events: [] });
    }

    // Fetch event details for each favorite
    const events = await Promise.all(
      ids.map(async (id) => {
        try {
          const response = await axios.get(
            `https://app.ticketmaster.com/discovery/v2/events/${id}.json`,
            {
              params: {
                apikey: TICKETMASTER_API_KEY
              }
            }
          );
          return response.data;
        } catch (error) {
          console.error(`Failed to fetch event ${id}:`, error);
          return null;
        }
      })
    );

    res.json({ events: events.filter(e => e !== null) });
  } catch (error) {
    console.error('Favorites fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// Favorites - Add/Remove favorite
app.put('/api/favorites', async (req, res) => {
  try {
    const { eventId, action } = req.body;
    
    // In production, this would update MongoDB
    // For now, it's handled by localStorage on frontend
    // But you can add MongoDB logic here:
    
    if (db) {
      const collection = db.collection('favorites');
      
      if (action === 'add') {
        await collection.updateOne(
          { eventId },
          { $set: { eventId, addedAt: new Date() } },
          { upsert: true }
        );
      } else if (action === 'remove') {
        await collection.deleteOne({ eventId });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Favorites update error:', error);
    res.status(500).json({ error: 'Failed to update favorites' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Make sure to set up your .env file with API keys!');
});

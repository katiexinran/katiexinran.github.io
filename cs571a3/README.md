# Event Search Application - Backend

Node.js Express backend for the Event Search Application (CSCI 571 HW3).

## Setup Instructions

### 1. Prerequisites
- Node.js 18.x or higher
- MongoDB Atlas account
- Ticketmaster API key
- Spotify API credentials
- Google Cloud Platform account

### 2. Installation

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Fill in your API credentials:
- TICKETMASTER_API_KEY: Get from https://developer.ticketmaster.com
- SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET: Get from https://developer.spotify.com/dashboard
- MONGODB_URI: Get from MongoDB Atlas connection string

### 4. Local Development

```bash
npm run dev
```

Server will run on http://localhost:8080

### 5. API Endpoints

#### Search
- `GET /api/search/autocomplete?keyword=<keyword>` - Get event suggestions
- `GET /api/search?keyword=<keyword>&category=<category>&distance=<distance>&latitude=<lat>&longitude=<lng>` - Search events

#### Event Details
- `GET /api/events/:id` - Get event details

#### Favorites
- `GET /api/favorites` - Get all favorite events
- `POST /api/favorites/:id` - Add event to favorites
- `DELETE /api/favorites/:id` - Remove event from favorites

#### Spotify
- `GET /api/artist/:name` - Get artist info from Spotify
- `GET /api/artist/:id/albums` - Get artist albums

### 6. Deployment to Google Cloud

#### Option A: App Engine
```bash
gcloud app deploy app.yaml
```

#### Option B: Cloud Run
```bash
gcloud run deploy event-search-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --set-env-vars TICKETMASTER_API_KEY=<key>,SPOTIFY_CLIENT_ID=<id>,SPOTIFY_CLIENT_SECRET=<secret>,MONGODB_URI=<uri>
```

### 7. MongoDB Setup

1. Create MongoDB Atlas account
2. Create a project
3. Create a cluster
4. Create database `HW3` with collection `favorites`
5. Add database user credentials
6. Add IP access (0.0.0.0/0 for development, specific IP for production)
7. Copy connection string to MONGODB_URI

## Project Structure

```
backend/
├── server.js          # Main server file
├── package.json       # Dependencies
├── .env              # Environment variables (not in git)
├── .env.example      # Example env file
├── app.yaml          # Google App Engine config
└── README.md         # This file
```

## Important Notes

- Never commit `.env` file to git
- Always use `.env.example` as template
- Keep API keys secure
- Test locally before deploying to GCP
- Monitor Cloud Logs for errors
- Use Cloud Functions for testing endpoints

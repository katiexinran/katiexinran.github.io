# Events Around - Ticketmaster Event Search Application

A full-stack web application for searching and managing favorite events using the Ticketmaster API, Spotify API, and MongoDB Atlas.

## Features

- 🔍 Search events by keyword, location, category, and distance
- 📍 Auto-detect user location using IPinfo API
- ⭐ Add/remove events from favorites (persisted in MongoDB)
- 🎵 View artist/band details from Spotify (for music events)
- 🏟️ View venue information with Google Maps integration
- 📱 Fully responsive design (mobile & desktop)
- 🔄 Seamless navigation with state preservation
- 🔔 Toast notifications with undo functionality

## Technology Stack

### Frontend
- React 18
- TypeScript
- Vite
- React Router v6
- Tailwind CSS
- Shadcn UI Components
- Lucide Icons
- Sonner (Toast Notifications)

### Backend
- Node.js
- Express
- MongoDB Atlas
- Axios

### APIs Used
- Ticketmaster Discovery API
- Spotify Web API
- IPinfo API (for geolocation)

## Prerequisites

- Node.js >= 18.0.0
- npm or bun
- MongoDB Atlas account
- API Keys for:
  - Ticketmaster
  - Spotify (Client ID & Secret)
  - IPinfo

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd kate_hw_a3
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Configure Environment Variables

Create `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3001
VITE_IPINFO_TOKEN=your_ipinfo_token_here
```

Create `.env` file in the `backend` directory:

```env
TICKETMASTER_API_KEY=your_ticketmaster_key_here
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
MONGODB_URI=your_mongodb_atlas_connection_string
PORT=3001
```

### 4. Run the Application

Open two terminal windows:

**Terminal 1 - Backend Server:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend Development Server:**
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## Building for Production

### Build the Frontend

```bash
npm run build
```

This creates an optimized build in the `dist/` directory.

### Test Production Build Locally

```bash
# Build frontend
npm run build

# Copy dist to backend (if needed for serving)
# The backend server.js already serves from ../dist

# Start backend (which will serve the built frontend)
cd backend
npm start
```

Visit `http://localhost:3001` to test the production build.

## Deployment to Google Cloud (App Engine)

### Prerequisites
- Google Cloud account
- gcloud CLI installed and configured
- Google Cloud project created

### 1. Install Google Cloud SDK

Follow instructions at: https://cloud.google.com/sdk/docs/install

### 2. Initialize gcloud

```bash
gcloud init
gcloud auth login
```

### 3. Select/Create a Google Cloud Project

```bash
gcloud projects create your-project-id
gcloud config set project your-project-id
```

### 4. Enable Required APIs

```bash
gcloud services enable appengine.googleapis.com
```

### 5. Set Environment Variables in Google Cloud

**IMPORTANT:** Don't commit API keys to app.yaml. Set them in Google Cloud:

```bash
gcloud app deploy
```

Or use the Google Cloud Console to set environment variables:
- Go to App Engine > Settings > Environment Variables
- Add:
  - `TICKETMASTER_API_KEY`
  - `SPOTIFY_CLIENT_ID`
  - `SPOTIFY_CLIENT_SECRET`
  - `MONGODB_URI`

### 6. Build and Deploy

```bash
# Build the frontend
npm run build

# Deploy to App Engine
gcloud app deploy

# View the deployed application
gcloud app browse
```

### 7. Update Frontend API URL

After deployment, update your frontend `.env` to point to your deployed backend:

```env
VITE_API_URL=https://your-project-id.uc.r.appspot.com
```

Rebuild and redeploy:

```bash
npm run build
gcloud app deploy
```

## Project Structure

```
kate_hw_a3/
├── backend/
│   ├── server.js              # Express server
│   ├── package.json
│   └── .env                   # Backend environment variables
├── src/
│   ├── components/
│   │   ├── Navbar.tsx         # Navigation with mobile menu
│   │   ├── event/             # Event detail components
│   │   │   ├── EventInfo.tsx
│   │   │   ├── EventArtists.tsx
│   │   │   ├── EventVenue.tsx
│   │   │   └── FavoriteButton.tsx
│   │   ├── search/            # Search-related components
│   │   │   ├── SearchForm.tsx
│   │   │   ├── EventCard.tsx
│   │   │   ├── EventsGrid.tsx
│   │   │   └── KeywordAutocomplete.tsx
│   │   └── ui/                # Shadcn UI components
│   ├── pages/
│   │   ├── Search.tsx         # Main search page
│   │   ├── EventDetail.tsx    # Event details page
│   │   ├── Favorites.tsx      # Favorites page
│   │   └── NotFound.tsx       # 404 page
│   ├── types/
│   │   └── event.ts           # TypeScript interfaces
│   ├── App.tsx                # Main app component
│   └── main.tsx               # Entry point
├── dist/                      # Production build (generated)
├── app.yaml                   # Google App Engine configuration
├── .env                       # Frontend environment variables
├── package.json
└── vite.config.ts

```

## API Endpoints

### Backend REST API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/search` | GET | Search events |
| `/api/suggest` | GET | Autocomplete suggestions |
| `/api/event_details/:id` | GET | Get event details |
| `/api/artist_details` | GET | Get Spotify artist info |
| `/api/artist_albums` | GET | Get artist albums |
| `/api/favorites` | GET | Get all favorites |
| `/api/favorites` | POST | Add to favorites |
| `/api/favorites/:id` | DELETE | Remove from favorites |

## Features Checklist

- ✅ Search form with autocomplete
- ✅ Auto-detect location
- ✅ Event search with Ticketmaster API
- ✅ Event details page with tabs
- ✅ Spotify integration for music events
- ✅ Venue information with Google Maps
- ✅ Favorites system with MongoDB
- ✅ Toast notifications with undo
- ✅ State preservation on navigation
- ✅ Responsive design
- ✅ Mobile hamburger menu
- ✅ Social sharing (Facebook & Twitter)

## Troubleshooting

### MongoDB Connection Issues
- Ensure your IP is whitelisted in MongoDB Atlas
- Check that your connection string is correct
- Verify network access settings in Atlas

### API Key Issues
- Verify all API keys are set correctly in .env files
- Check that Spotify credentials are valid
- Ensure Ticketmaster API key has proper permissions

### Build Issues
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear dist folder: `rm -rf dist`
- Check Node.js version: `node --version` (should be >= 18)

### Deployment Issues
- Ensure dist folder is built before deploying
- Check Google Cloud logs: `gcloud app logs tail`
- Verify environment variables are set in Google Cloud Console

## License

This project is for educational purposes.

## Credits

- Built as part of CSCI 571 - Web Technologies course
- APIs: Ticketmaster, Spotify, IPinfo
- UI Components: Shadcn UI

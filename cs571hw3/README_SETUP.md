# Ticketmaster Event Search Application - Setup Guide

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account (or local MongoDB)
- API Keys for:
  - Ticketmaster API
  - Spotify API (Client ID & Client Secret)
  - Google Maps Geocoding API
  - IPinfo API

---

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Set Up Environment Variables

#### Frontend (.env)
Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_IPINFO_TOKEN=your_ipinfo_token
VITE_API_URL=http://localhost:3001
```

#### Backend (backend/.env)
Create a `backend/.env` file:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and add your API keys:
```env
TICKETMASTER_API_KEY=your_ticketmaster_api_key
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
MONGODB_URI=your_mongodb_atlas_connection_string
PORT=3001
```

### 3. Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account and cluster
3. Create a database named `HW3`
4. Create a collection named `favorites`
5. Add your IP address to the IP Access List (or use 0.0.0.0/0 for development)
6. Create a database user with read/write permissions
7. Get your connection string and add it to `backend/.env`

Connection string format:
```
mongodb+srv://username:password@cluster.mongodb.net/HW3?retryWrites=true&w=majority
```

### 4. Run the Application

Open **two terminal windows**:

#### Terminal 1 - Backend Server
```bash
cd backend
npm run dev
```

The backend will run on `http://localhost:3001`

#### Terminal 2 - Frontend Development Server
```bash
npm run dev
```

The frontend will run on `http://localhost:8080`

---

## 🔑 Getting API Keys

### Ticketmaster API
1. Go to [Ticketmaster Developer Portal](https://developer.ticketmaster.com/)
2. Sign up for a free account
3. Create a new app
4. Copy your API Key (Consumer Key)

### Spotify API
1. Go to [Spotify for Developers](https://developer.spotify.com/)
2. Log in with your Spotify account
3. Go to Dashboard → Create an App
4. Copy your Client ID and Client Secret

### Google Maps Geocoding API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable "Geocoding API"
4. Create credentials (API Key)
5. Restrict the key to "Geocoding API" and your domain

### IPinfo API
1. Go to [IPinfo.io](https://ipinfo.io/)
2. Sign up for a free account
3. Copy your access token

---

## 📁 Project Structure

```
.
├── backend/                  # Node.js Express backend
│   ├── server.js            # Main server file
│   ├── package.json         # Backend dependencies
│   └── .env                 # Backend environment variables
├── src/
│   ├── components/          # React components
│   │   ├── Navbar.tsx       # Navigation bar
│   │   ├── search/          # Search page components
│   │   └── event/           # Event detail components
│   ├── pages/               # Route pages
│   │   ├── Search.tsx       # Main search page
│   │   ├── Favorites.tsx    # Favorites page
│   │   └── EventDetail.tsx  # Event details page
│   ├── types/               # TypeScript types
│   └── App.tsx              # Main app component
├── .env                     # Frontend environment variables
└── package.json             # Frontend dependencies
```

---

## 🌐 Deployment (For Final Submission)

### Backend - Google Cloud Platform

1. **Install Google Cloud SDK**
   ```bash
   # Follow instructions at: https://cloud.google.com/sdk/docs/install
   ```

2. **Deploy to Google App Engine**
   ```bash
   cd backend
   gcloud app deploy
   ```

3. **Update Frontend API URL**
   Update `.env` with your deployed backend URL:
   ```env
   VITE_API_URL=https://your-backend-url.appspot.com
   ```

### Frontend - Any Static Hosting

Build the frontend:
```bash
npm run build
```

The `dist` folder can be deployed to:
- Google Cloud Storage + CDN
- Firebase Hosting
- Netlify
- Vercel

---

## 🧪 Testing

### Test Backend Endpoints

```bash
# Health check
curl http://localhost:3001/api/health

# Search events
curl "http://localhost:3001/api/events/search?keyword=Lakers&radius=10&unit=miles&latlong=34.0522,-118.2437"

# Get event details
curl "http://localhost:3001/api/events/EVENT_ID"
```

### Test Frontend

1. Open `http://localhost:8080` in Chrome
2. Test the search form with various inputs
3. Test auto-detect location
4. Test event details page
5. Test favorites functionality
6. Test responsive design (Chrome DevTools)

---

## 🐛 Troubleshooting

### Backend won't start
- Check if MongoDB connection string is correct
- Ensure all API keys are set in `backend/.env`
- Check if port 3001 is available

### Frontend API calls failing
- Verify backend is running on `http://localhost:3001`
- Check browser console for CORS errors
- Verify API keys in `.env`

### MongoDB connection issues
- Check IP whitelist in MongoDB Atlas
- Verify connection string format
- Ensure database user has proper permissions

### Google Maps Geocoding not working
- Check API key restrictions
- Verify billing is enabled (free tier available)
- Check browser console for errors

---

## 📝 Assignment Requirements Checklist

- [x] React frontend with Shadcn + Tailwind CSS
- [x] Node.js Express backend
- [x] Three routes: Search, Event Details, Favorites
- [x] Search form with autocomplete
- [x] Event results grid
- [x] Event detail page with 3 tabs
- [x] Favorites functionality with MongoDB
- [x] Social sharing (Facebook, Twitter)
- [x] Responsive design
- [x] Form validation
- [x] Toast notifications (Sonner)

---

## 💡 Tips

- Use Chrome DevTools Network tab to debug API calls
- Check both frontend and backend console for errors
- Use MongoDB Compass to inspect your database
- Test on both desktop and mobile viewports

---

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Atlas Docs](https://www.mongodb.com/docs/atlas/)
- [Ticketmaster API Docs](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api/)

---

Need help? Check the assignment description PDF and rubric for detailed requirements!

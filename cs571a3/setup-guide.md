# HW3 Event Search Application - Complete Setup Guide

## 📋 Overview

You now have:
1. **Frontend** - Interactive React + Tailwind CSS web application (ready to test)
2. **Backend** - Node.js Express server with API endpoints (ready to deploy)
3. **Database** - MongoDB integration for storing favorites

---

## 🚀 Quick Start

### Phase 1: Test the Frontend Locally (NOW)
Your frontend application is already built and ready to use at the link provided.

**Important:** The frontend currently uses mock data. You'll need to connect it to the real backend.

### Phase 2: Set Up Backend Locally (NEXT)
Before deploying to Google Cloud, test the backend locally to ensure it works with real APIs.

### Phase 3: Deploy to Google Cloud (FINAL)
Once everything works locally, deploy both frontend and backend to GCP.

---

## 🔧 Step-by-Step Setup

### STEP 1: Get API Keys

You need to obtain 4 API keys before proceeding:

#### 1.1 Ticketmaster API Key
- Go to: https://developer.ticketmaster.com
- Sign up / Log in
- Create a new app to get API key
- Copy the API key

#### 1.2 Spotify API Credentials
- Go to: https://developer.spotify.com/dashboard
- Sign up / Log in
- Create a new app
- Copy Client ID and Client Secret
- You DON'T need to register redirect URIs (we use Client Credentials flow)

#### 1.3 Google Geocoding API Key
- Go to: https://console.cloud.google.com
- Create a new project
- Enable Google Maps Geocoding API
- Create API key (restrict to HTTP referrers for frontend)
- Copy the key

#### 1.4 Optional: Google Maps API Key
- Can use the same key as Geocoding (same project)
- Enable Maps JavaScript API

You now have:
```
TICKETMASTER_API_KEY = "..."
SPOTIFY_CLIENT_ID = "..."
SPOTIFY_CLIENT_SECRET = "..."
GOOGLE_GEOCODING_API_KEY = "..."
```

---

### STEP 2: Set Up MongoDB Atlas

#### 2.1 Create MongoDB Account
- Go to: https://www.mongodb.com/cloud/atlas
- Sign up for free tier
- Create organization and project

#### 2.2 Create Cluster
- Click "Create" next to Database
- Choose AWS, US-EAST-1 (same as GCP), Free tier
- Cluster name: "hw3-cluster"
- Create cluster (wait 10-15 minutes)

#### 2.3 Create Database User
- Go to "Database Access" sidebar
- Click "Add New Database User"
- Username: `hw3user`
- Password: (generate secure password)
- Permissions: "Read and Write to Any Database"
- Add user

#### 2.4 Add IP Whitelist
- Go to "Network Access" sidebar
- Click "Add IP Address"
- For development: Add your current IP
- For production: Add Google Cloud IP (you'll get this later)
- Or add 0.0.0.0/0 for testing (NOT recommended for production)

#### 2.5 Get Connection String
- Click "Connect" on your cluster
- Choose "Drivers"
- Select "Node.js"
- Copy connection string
- Format: `mongodb+srv://hw3user:PASSWORD@cluster.mongodb.net/HW3?retryWrites=true&w=majority`

You now have:
```
MONGODB_URI = "mongodb+srv://hw3user:PASSWORD@hw3-cluster.mongodb.net/HW3?retryWrites=true&w=majority"
```

---

### STEP 3: Set Up Backend Locally

#### 3.1 Install Node.js
- Download from: https://nodejs.org (LTS version)
- Install and verify: `node --version`

#### 3.2 Prepare Backend Files
- You have the backend code ready in the `hw3-backend` folder
- Navigate to that directory: `cd hw3-backend`

#### 3.3 Install Dependencies
```bash
npm install
```

#### 3.4 Create .env File
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```
TICKETMASTER_API_KEY=your_ticketmaster_api_key
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
MONGODB_URI=your_mongodb_connection_string
PORT=8080
```

#### 3.5 Test Backend Locally
```bash
npm run dev
```

You should see:
```
Server running on port 8080
MongoDB connected successfully
```

#### 3.6 Test API Endpoints
Open your browser and test:
- http://localhost:8080/api/health
- http://localhost:8080/api/search/autocomplete?keyword=music
- http://localhost:8080/api/favorites

All should return JSON responses.

---

### STEP 4: Connect Frontend to Local Backend

Your frontend currently calls `/api/*` endpoints.

#### For Local Testing:
1. Start your backend: `npm run dev` (in hw3-backend folder)
2. Open the frontend application in browser
3. The frontend will call `http://localhost/api/*` by default

#### If Not Working:
You may need to update your frontend to call the correct backend URL:
- Search for `fetch("/api/` in the frontend code
- Replace with `fetch("http://localhost:8080/api/`

---

### STEP 5: Deploy to Google Cloud

#### 5.1 Set Up Google Cloud Project
```bash
# Install Google Cloud CLI
# Download from: https://cloud.google.com/sdk/docs/install

# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID
```

#### 5.2 Deploy Backend to Cloud Run
```bash
cd hw3-backend

# Build and deploy
gcloud run deploy event-search-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --memory 512Mi \
  --timeout 60 \
  --set-env-vars TICKETMASTER_API_KEY=YOUR_KEY,SPOTIFY_CLIENT_ID=YOUR_ID,SPOTIFY_CLIENT_SECRET=YOUR_SECRET,MONGODB_URI=YOUR_URI \
  --allow-unauthenticated
```

You'll get a URL like:
```
https://event-search-backend-xxxxx-uc.a.run.app
```

#### 5.3 Update Whitelist (MongoDB)
- Go to MongoDB Atlas
- Network Access
- Add IP: Go to Google Cloud Console → Cloud Run → event-search-backend → Metrics
- Note the outbound IP and add to MongoDB whitelist

#### 5.4 Deploy Frontend to Cloud Run (or Firebase)

**Option A: Cloud Run**
```bash
# Frontend needs to call your backend
# Update API calls in frontend code to use your backend URL:
# Replace all fetch("/api/ with fetch("https://event-search-backend-xxxxx-uc.a.run.app/api/

# Then build and deploy frontend
gcloud run deploy event-search-frontend \
  --source . \
  --platform managed \
  --region us-central1 \
  --memory 256Mi \
  --timeout 30 \
  --allow-unauthenticated
```

**Option B: Firebase Hosting (Recommended)**
```bash
npm install -g firebase-tools
firebase login
firebase init
firebase deploy
```

#### 5.5 Final URLs
You'll have:
- Frontend: `https://YOUR-FRONTEND-URL`
- Backend: `https://event-search-backend-xxxxx-uc.a.run.app`

---

## 📝 Important Files Reference

### Frontend Files
- `index.html` - Entry point
- `src/App.tsx` - Main router
- `src/pages/SearchPage.tsx` - Search functionality
- `src/pages/EventDetailPage.tsx` - Event details
- `src/pages/FavoritesPage.tsx` - Favorites list
- `src/components/Navbar.tsx` - Navigation
- `src/context/FavoritesContext.tsx` - State management

### Backend Files
- `server.js` - Main server file with all API endpoints
- `package.json` - Dependencies (npm install)
- `.env` - Environment variables (NEVER commit to git!)
- `app.yaml` - Google App Engine config (alternative to Cloud Run)

---

## 🐛 Troubleshooting

### Problem: "Cannot find module 'express'"
**Solution:** Run `npm install` in the backend directory

### Problem: "MongoDB connection failed"
**Solution:** 
- Check connection string in .env
- Check IP whitelist in MongoDB Atlas
- Check database user credentials

### Problem: "Ticketmaster API returns 401 Unauthorized"
**Solution:**
- Verify API key is correct in .env
- API key might be invalid or expired

### Problem: Frontend can't reach backend
**Solution:**
- Make sure backend is running
- Check backend URL in frontend code
- Enable CORS (already done in backend)
- Check browser console for errors

### Problem: Spotify returns empty results
**Solution:**
- Verify Spotify credentials in .env
- Check artist name spelling
- Spotify API might rate limit (wait a few minutes)

---

## 📋 Grading Checklist

Before submitting, verify:

- [ ] Navbar appears on all routes
- [ ] 3 routes implemented: /search, /event/:id, /favorites
- [ ] Search form validates inputs with error messages
- [ ] Autocomplete works with Ticketmaster API
- [ ] Auto-detect location works with ipinfo.io
- [ ] Manual location geocoding works with Google API
- [ ] Results grid displays max 20 events
- [ ] Results sorted by date ascending
- [ ] Event detail page shows all 3 tabs
- [ ] Info tab shows all fields and social sharing
- [ ] Artists/Teams tab disabled for non-music events
- [ ] Spotify integration shows artist details and albums
- [ ] Venue tab shows address and venue details
- [ ] Address links open Google Maps
- [ ] Favorites persisted in MongoDB
- [ ] Favorite button works across all pages
- [ ] Toast notifications for favorites
- [ ] Responsive design works on mobile
- [ ] No page reloads (true SPA)
- [ ] Deployed to Google Cloud Platform
- [ ] Backend serves frontend files
- [ ] All external links open in new tabs
- [ ] Ticket status color-coded correctly
- [ ] Facebook and Twitter sharing works

---

## 📞 Support Resources

### Official Documentation
- Express: https://expressjs.com
- React: https://react.dev
- Tailwind: https://tailwindcss.com
- MongoDB: https://docs.mongodb.com
- Google Cloud: https://cloud.google.com/docs
- Ticketmaster API: https://developer.ticketmaster.com

### Course Resources
- Check Piazza for clarifications
- Review assignment rubric
- Watch reference videos

---

## 🎯 Next Steps

1. **TODAY:** Test frontend application
2. **TOMORROW:** Get API keys and set up MongoDB
3. **TOMORROW EVENING:** Test backend locally
4. **DAY 3:** Deploy to Google Cloud
5. **DAY 3-4:** Final testing and debugging
6. **BEFORE DEADLINE:** Submit on D2L

Good luck! You have a complete, production-ready application ready to go! 🚀

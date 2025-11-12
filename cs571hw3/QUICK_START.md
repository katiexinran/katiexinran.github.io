# Quick Start Guide

## Getting Started in 5 Minutes

### 1. Install Dependencies

```powershell
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Configure API Keys

Create `.env` in root directory:
```env
VITE_API_URL=http://localhost:3001
VITE_IPINFO_TOKEN=3d5aa08629e9e7
```

Create `backend/.env`:
```env
TICKETMASTER_API_KEY=w71ehIlQymxGnc42SoC5Mw7AXg2eKACY
SPOTIFY_CLIENT_ID=78741ea495f94ba08ebe67a8ce5e9e6c
SPOTIFY_CLIENT_SECRET=bfb6e178c8ed4231aead9fe985db786d
MONGODB_URI=mongodb+srv://kxhancoc_db_user:fJ8u577JoCJOiV7i@cluster0.j0a2zif.mongodb.net/?appName=Cluster0
PORT=3001
```

### 3. Run the Application

Open **two** PowerShell windows:

**Window 1 - Backend:**
```powershell
cd backend
npm start
```

**Window 2 - Frontend:**
```powershell
npm run dev
```

### 4. Open in Browser

Visit: http://localhost:8080

### 5. Test Basic Features

1. **Search**: Enter "Lakers", select "Sports", enter "Los Angeles", click Search
2. **Favorite**: Click heart icon on any event
3. **Details**: Click on an event card to view details
4. **Tabs**: Try Info, Artist/Team (if music), Venue tabs
5. **Favorites**: Click "Favorites" in navbar to see saved events

## Common Issues

### Backend won't start
```powershell
cd backend
rm -r node_modules
npm install
npm start
```

### Frontend won't start
```powershell
rm -r node_modules
npm install
npm run dev
```

### MongoDB connection fails
- Check your IP is whitelisted in MongoDB Atlas
- Verify connection string in `backend/.env`

### API calls fail
- Verify all API keys are correct in `.env` files
- Check backend is running on port 3001
- Look for errors in backend console

## Development Commands

```powershell
# Frontend development server
npm run dev

# Build for production
npm run build

# Backend development (with hot reload)
cd backend
npm run dev

# Backend production
cd backend
npm start

# Run both frontend and backend (requires 2 terminals)
# Terminal 1:
cd backend; npm start

# Terminal 2:
npm run dev
```

## File Structure Overview

```
kate_hw_a3/
├── backend/
│   ├── server.js          # Express server & API routes
│   └── .env               # Backend API keys
├── src/
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── event/         # Event detail components
│   │   └── search/        # Search-related components
│   ├── pages/
│   │   ├── Search.tsx     # Main search page
│   │   ├── EventDetail.tsx
│   │   └── Favorites.tsx
│   └── App.tsx
├── .env                   # Frontend environment vars
└── package.json
```

## Next Steps

1. Review [TESTING_GUIDE.md](./TESTING_GUIDE.md) for comprehensive testing
2. Review [DEPLOYMENT_README.md](./DEPLOYMENT_README.md) for deployment instructions
3. Check the assignment rubric for grading criteria

## Support

- Check console logs in browser (F12) for frontend errors
- Check PowerShell terminal for backend errors
- Verify all API keys are valid
- Ensure MongoDB Atlas is accessible

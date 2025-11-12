# Events Around - CSCI 571 Assignment 3

A full-stack event search application using Ticketmaster API, Spotify API, and MongoDB Atlas.

## ⚡ Quick Start

See [QUICK_START.md](./QUICK_START.md) for a 5-minute setup guide.

```powershell
# 1. Install dependencies
npm install
cd backend && npm install && cd ..

# 2. Configure .env files (see QUICK_START.md)

# 3. Run (in separate terminals)
cd backend && npm start           # Terminal 1: Backend
npm run dev                       # Terminal 2: Frontend
```

Visit: http://localhost:8080

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Get started in 5 minutes
- **[DEPLOYMENT_README.md](./DEPLOYMENT_README.md)** - Full documentation & deployment guide
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Comprehensive testing checklist
- **[HW3 Rubric.pdf](./HW3%20Rubric.pdf)** - Assignment requirements & grading

## ✨ Features

- 🔍 Search events by keyword, location, category, and distance
- 📍 Auto-detect user location
- ⭐ Add/remove favorites (MongoDB persistence)
- 🎵 Spotify integration for music events
- 🏟️ Venue details with Google Maps
- 📱 Fully responsive (mobile & desktop)
- 🔄 State preservation on navigation
- 🔔 Toast notifications with undo

## 🛠️ Tech Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, Shadcn UI  
**Backend:** Node.js, Express, MongoDB Atlas  
**APIs:** Ticketmaster, Spotify, IPinfo

## 📦 Project Structure

```
kate_hw_a3/
├── backend/
│   ├── server.js              # Express API server
│   ├── package.json
│   └── .env                   # Backend config (API keys)
├── src/
│   ├── components/            # React components
│   │   ├── Navbar.tsx
│   │   ├── event/             # Event detail components
│   │   └── search/            # Search components
│   ├── pages/                 # Route pages
│   │   ├── Search.tsx
│   │   ├── EventDetail.tsx
│   │   └── Favorites.tsx
│   ├── App.tsx                # Main app
│   └── main.tsx               # Entry point
├── .env                       # Frontend config
├── app.yaml                   # Google Cloud deployment
└── package.json
```

## 🚀 Deployment

Deploy to Google Cloud App Engine:

```powershell
npm run build
gcloud app deploy
```

See [DEPLOYMENT_README.md](./DEPLOYMENT_README.md) for detailed instructions.

## 📝 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/search` | GET | Search events |
| `/api/suggest` | GET | Autocomplete |
| `/api/event_details/:id` | GET | Event details |
| `/api/artist_details` | GET | Spotify artist info |
| `/api/artist_albums` | GET | Artist albums |
| `/api/favorites` | GET/POST/DELETE | Manage favorites |

## 🧪 Testing

Follow the comprehensive testing guide: [TESTING_GUIDE.md](./TESTING_GUIDE.md)

Key tests:
- ✅ Search functionality
- ✅ Autocomplete & auto-detect location  
- ✅ Favorites (add/remove/undo)
- ✅ Event details with tabs
- ✅ Spotify & venue integration
- ✅ Mobile responsiveness
- ✅ State preservation

## ⚠️ Prerequisites

- Node.js >= 18.0.0
- MongoDB Atlas account
- API Keys: Ticketmaster, Spotify, IPinfo

## 📞 Support

Check these if you encounter issues:
1. Console logs (F12 in browser)
2. Backend terminal output
3. Verify API keys in `.env` files
4. Check MongoDB Atlas connection

## 📄 License

Educational project for CSCI 571 - Web Technologies

---

**Course:** CSCI 571 - Web Technologies  
**Institution:** USC  
**Assignment:** HW3 - Events Around Application

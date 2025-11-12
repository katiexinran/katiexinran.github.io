# Testing Guide - Events Around Application

This guide walks through how to test all features of the application based on the assignment requirements.

## Prerequisites

1. **Backend is running** on http://localhost:3001
2. **Frontend is running** on http://localhost:8080 (or served from backend after build)
3. All API keys are properly configured in `.env` files

## Test Plan

### 1. Search Functionality

#### 1.1 Basic Search
- [ ] Enter keyword "Lakers" in the Keywords field
- [ ] Leave Category as "All"
- [ ] Enter "Los Angeles" in Location
- [ ] Set Distance to 10 miles
- [ ] Click "Search" button
- [ ] **Expected**: Grid of up to 20 events displayed
- [ ] **Expected**: Events sorted by date (ascending)

#### 1.2 Autocomplete
- [ ] Start typing "taylor" in Keywords field
- [ ] **Expected**: Dropdown shows suggestions including artist names
- [ ] **Expected**: Loading spinner appears while fetching
- [ ] Select a suggestion from dropdown
- [ ] **Expected**: Field populates with selected value
- [ ] **Expected**: X icon appears to clear the field

#### 1.3 Auto-Detect Location
- [ ] Toggle "Auto-detect" switch ON
- [ ] **Expected**: Location field becomes disabled and clears
- [ ] **Expected**: Toast notification "Location detected successfully"
- [ ] **Expected**: Location field shows detected city/state
- [ ] Toggle "Auto-detect" switch OFF
- [ ] **Expected**: Location field becomes enabled again

#### 1.4 Category Filter
- [ ] Select "Music" from Category dropdown
- [ ] Search for "concert"
- [ ] **Expected**: Only Music events are shown

#### 1.5 Form Validation
- [ ] Leave Keywords empty
- [ ] Click "Search"
- [ ] **Expected**: Red error "Please enter some keywords" below Keywords field
- [ ] **Expected**: Keywords field has red border
- [ ] Turn OFF auto-detect
- [ ] Leave Location empty
- [ ] Click "Search"
- [ ] **Expected**: Red error "Location is required..." below Location field

#### 1.6 Clear Functionality
- [ ] Fill out all form fields
- [ ] Click "Clear" button
- [ ] **Expected**: All fields reset to default values
- [ ] **Expected**: Results grid clears

#### 1.7 No Results
- [ ] Search for "asdfjkl123notrealevent"
- [ ] **Expected**: "Nothing found" message with Search icon
- [ ] **Expected**: "Update the query to find events near you" text

### 2. Event Card Display

#### 2.1 Card Layout
- [ ] View search results
- [ ] **Expected**: Cards show:
  - Event image (full width, no padding)
  - Category badge (top-left, white background)
  - Date/Time badge (top-right, white background)
  - Event name (bold, below image)
  - Venue name (gray text)
  - Heart icon (favorite button)
- [ ] **Expected**: Grid layout: 3-4 columns on desktop, 1 on mobile

#### 2.2 Card Interactions
- [ ] Hover over a card
- [ ] **Expected**: Shadow increases
- [ ] **Expected**: Image scales slightly
- [ ] Click anywhere on card (except heart icon)
- [ ] **Expected**: Navigate to Event Details page

### 3. Favorites System

#### 3.1 Add to Favorites
- [ ] Click heart icon on an unfavorited event card
- [ ] **Expected**: Heart fills with red color
- [ ] **Expected**: Toast: "[Event Name] added to favorites!" with green checkmark
- [ ] Refresh the page
- [ ] **Expected**: Heart still shows as favorited (persisted in MongoDB)

#### 3.2 Remove from Favorites
- [ ] Click heart icon on a favorited event
- [ ] **Expected**: Heart becomes outline only
- [ ] **Expected**: Toast: "[Event Name] removed from favorites!" with info icon
- [ ] **Expected**: Toast has black "Undo" button

#### 3.3 Undo Removal
- [ ] Remove an event from favorites
- [ ] Click "Undo" button on the toast notification
- [ ] **Expected**: Event is re-added to favorites
- [ ] **Expected**: Heart icon fills with red again
- [ ] **Expected**: New toast: "[Event Name] re-added to favorites!"

#### 3.4 Favorites Page
- [ ] Click "Favorites" in navbar
- [ ] **Expected**: See all favorited events
- [ ] **Expected**: Events shown in order they were added
- [ ] **Expected**: Each card has a filled red heart
- [ ] Remove all favorites
- [ ] **Expected**: "No favorite events yet." message
- [ ] Click heart on several events from search
- [ ] Return to Favorites page
- [ ] **Expected**: All newly favorited events appear

#### 3.5 Consistency
- [ ] Favorite an event from search results
- [ ] Navigate to event details
- [ ] **Expected**: Heart icon is filled/favorited
- [ ] Navigate to Favorites page
- [ ] **Expected**: Event appears in list
- [ ] Unfavorite from Favorites page
- [ ] Return to search or event details
- [ ] **Expected**: Heart is no longer filled

### 4. Event Details Page

#### 4.1 Navigation
- [ ] Click on an event card
- [ ] **Expected**: Navigate to `/event/[id]`
- [ ] **Expected**: "Back to Search" button with left arrow
- [ ] **Expected**: Event name displayed prominently
- [ ] **Expected**: "Buy Tickets" button (black, with external link icon)
- [ ] **Expected**: Heart icon (square border, reflects favorite status)

#### 4.2 Back Button with State Preservation
- [ ] Perform a search
- [ ] Scroll down the results
- [ ] Click on an event
- [ ] Click "Back to Search"
- [ ] **Expected**: Return to search page
- [ ] **Expected**: Search form has same values
- [ ] **Expected**: Results are still displayed
- [ ] **Expected**: Scroll position is restored

#### 4.3 Buy Tickets Button
- [ ] Click "Buy Tickets" button
- [ ] **Expected**: Opens Ticketmaster event page in new tab

### 5. Event Details Tabs

#### 5.1 Info Tab (Default)
- [ ] Open any event details
- [ ] **Expected**: "Info" tab is selected by default
- [ ] **Expected**: Left column shows:
  - Date
  - Artist/Team
  - Venue
  - Genres (if available)
  - Price Range (if available)
  - Ticket Status (colored badge: green for On Sale, red for Off Sale, etc.)
  - Share icons (Facebook, Twitter)
- [ ] **Expected**: Right column shows seatmap image (if available)
- [ ] Fields with no data should not appear

#### 5.2 Social Sharing
- [ ] Click Facebook icon
- [ ] **Expected**: Opens Facebook share dialog in new tab
- [ ] **Expected**: URL is the event's Ticketmaster URL
- [ ] Click Twitter icon
- [ ] **Expected**: Opens Twitter share dialog in new tab
- [ ] **Expected**: Tweet text: "Check [Event Name] on Ticketmaster. [Event URL]"

#### 5.3 Artist/Team Tab
- [ ] Open a **Music** event
- [ ] **Expected**: "Artist/Team" tab is enabled
- [ ] Click "Artist/Team" tab
- [ ] **Expected**: Shows:
  - Artist name
  - Artist image
  - Followers count (formatted with commas, e.g., "1,234,567")
  - Popularity (number 0-100, no % sign)
  - Genres (if available)
  - "Open in Spotify" button (black, external link icon)
  - "Albums" section with grid of up to 3 album covers
- [ ] **Expected**: Each album cover is clickable
- [ ] Click an album cover
- [ ] **Expected**: Opens album on Spotify in new tab
- [ ] Click "Open in Spotify" button
- [ ] **Expected**: Opens artist page on Spotify in new tab

- [ ] Open a **Non-Music** event (e.g., Sports)
- [ ] **Expected**: "Artist/Team" tab is disabled (grayed out)
- [ ] **Expected**: Cannot click on disabled tab

#### 5.4 Venue Tab
- [ ] Click "Venue" tab
- [ ] **Expected**: Shows:
  - Venue name
  - Venue image (right side on desktop)
  - Address (clickable link with map pin icon)
  - "See Events" button (black, external link icon)
  - "Parking" section (if available)
  - "General Rule" section (if available)
  - "Child Rule" section (if available)
- [ ] Click the address link
- [ ] **Expected**: Opens Google Maps in new tab
- [ ] **Expected**: Map centered on venue's latitude/longitude
- [ ] Click "See Events" button
- [ ] **Expected**: Opens venue page on Ticketmaster in new tab

### 6. Mobile Responsiveness

#### 6.1 Navbar
- [ ] Resize browser to mobile width (< 768px)
- [ ] **Expected**: "Search" and "Favorites" links are hidden
- [ ] **Expected**: Hamburger menu icon (three lines) appears
- [ ] Click hamburger icon
- [ ] **Expected**: Side panel slides in from right
- [ ] **Expected**: "Search" and "Favorites" links shown in panel
- [ ] Click a link
- [ ] **Expected**: Panel closes and navigates

#### 6.2 Search Form
- [ ] View search form on mobile
- [ ] **Expected**: All form fields stack vertically
- [ ] **Expected**: Auto-detect switch and label appear inline
- [ ] **Expected**: Search and Clear buttons stack or appear inline

#### 6.3 Event Grid
- [ ] View search results on mobile
- [ ] **Expected**: Event cards display in single column
- [ ] **Expected**: Cards maintain proper spacing

#### 6.4 Event Details
- [ ] View event details on mobile
- [ ] **Expected**: Event title, buttons stack vertically
- [ ] **Expected**: Info tab: left/right columns stack vertically
- [ ] **Expected**: Artist tab: image and info stack vertically
- [ ] **Expected**: Venue tab: image and details stack vertically

#### 6.5 Toast Notifications
- [ ] Add/remove favorites on mobile
- [ ] **Expected**: Toasts appear at top-center
- [ ] **Expected**: "Undo" button is visible and clickable

### 7. Edge Cases

#### 7.1 Event with Missing Data
- [ ] Find an event with missing seatmap
- [ ] **Expected**: Seatmap section doesn't appear
- [ ] Find an event with missing price range
- [ ] **Expected**: Price Range section doesn't appear

#### 7.2 Non-Music Artist Tab
- [ ] Try to access artist details for a sports event
- [ ] **Expected**: Tab is disabled
- [ ] **Expected**: No Spotify data attempted to load

#### 7.3 Network Errors
- [ ] Turn off backend server
- [ ] Try to search
- [ ] **Expected**: Toast error: "Failed to fetch events"
- [ ] Turn backend back on
- [ ] Search again
- [ ] **Expected**: Works normally

### 8. Deployment Testing (Google Cloud)

#### 8.1 Build
- [ ] Run `npm run build`
- [ ] **Expected**: `dist/` directory created
- [ ] **Expected**: No build errors
- [ ] Check `dist/index.html` exists
- [ ] Check `dist/assets/` has JS and CSS files

#### 8.2 Local Production Test
- [ ] Start backend: `cd backend && npm start`
- [ ] Visit `http://localhost:3001`
- [ ] **Expected**: Serves the built frontend
- [ ] **Expected**: All features work

#### 8.3 Deployment
- [ ] Run `gcloud app deploy`
- [ ] Visit deployed URL
- [ ] Test all major features:
  - Search
  - Favorites (MongoDB)
  - Event details
  - Spotify integration
- [ ] **Expected**: Everything works on deployed site

### 9. Performance & UX

#### 9.1 Loading States
- [ ] During search
- [ ] **Expected**: "Searching for events..." with spinner
- [ ] During event detail load
- [ ] **Expected**: Loading spinner
- [ ] During artist detail load
- [ ] **Expected**: Loading spinner in Artist tab

#### 9.2 Smooth Transitions
- [ ] Navigate between pages
- [ ] **Expected**: No page reloads (SPA behavior)
- [ ] **Expected**: Smooth transitions

#### 9.3 Error Recovery
- [ ] Trigger validation errors
- [ ] Fix errors
- [ ] Submit form
- [ ] **Expected**: Errors clear, search proceeds

## Checklist Summary

### Critical Features (Must Work)
- [ ] Search with Ticketmaster API (keyword, location, category, distance)
- [ ] Autocomplete suggestions
- [ ] Auto-detect location
- [ ] Event grid sorted by date
- [ ] Event details page with tabs
- [ ] Artist details from Spotify (Music events only)
- [ ] Venue details with Google Maps
- [ ] Favorites persistence in MongoDB
- [ ] Add/Remove/Undo favorites
- [ ] State preservation on back navigation
- [ ] Social sharing (Facebook, Twitter)
- [ ] Mobile hamburger menu
- [ ] Responsive layout on mobile
- [ ] All external links open in new tabs
- [ ] No page reloads (SPA)

### Important Details
- [ ] Date format: MMM d, yyyy h:mm a
- [ ] Followers formatted with commas
- [ ] Popularity without % sign
- [ ] Ticket status color-coded badges
- [ ] Toast notifications with proper icons
- [ ] Clear button resets form
- [ ] Validation errors in red with red borders
- [ ] Heart icon state consistent everywhere

## Notes

- Test on multiple browsers: Chrome, Firefox, Safari, Edge
- Test on actual mobile devices if possible
- Use browser DevTools responsive mode for mobile testing
- Check browser console for errors
- Monitor Network tab for API calls
- Verify MongoDB Atlas has favorites data

## Reporting Issues

If you find issues, note:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Browser/device
5. Console errors
6. Network request details

"""
Flask backend for A2.

- Serves the static frontend (events.html, CSS, JS)
- GET /search : converts lat/lon → geohash and queries Ticketmaster Discovery API
"""

import os
import requests
from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS

# geohash via geolib (matches assignment hint)
from geolib import geohash as gh

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# ---- Config ----
TICKETMASTER_API_KEY = os.environ.get("TICKETMASTER_API_KEY", "").strip()
TM_SEARCH_URL = "https://app.ticketmaster.com/discovery/v2/events.json"

# Ticketmaster segmentIds per assignment categories
SEGMENT_IDS = {
    "music": "KZFzniwnSyZfZ7v7nJ",
    "sports": "KZFzniwnSyZfZ7v7nE",
    "arts": "KZFzniwnSyZfZ7v7na",       # Arts & Theatre
    "theatre": "KZFzniwnSyZfZ7v7na",
    "film": "KZFzniwnSyZfZ7v7nn",
    "miscellaneous": "KZFzniwnSyZfZ7v7n1",
}

# -------- Static routes --------
@app.route("/")
@app.route("/events.html")
def events_page():
    return send_from_directory(".", "events.html")


# -------- Search route (real TM call) --------
@app.get("/search")
def search():
    """
    Inputs (GET):
      - keyword (required)
      - distance (miles, default 10)
      - category (default)
      - lat, lon (required)

    Returns JSON:
      { "events": [ { "name": ..., "venue": ..., "date": ... }, ... ] }
    """
    if not TICKETMASTER_API_KEY:
        return jsonify({"error": "Ticketmaster API key not configured"}), 500

    keyword = (request.args.get("keyword") or "").strip()
    category = (request.args.get("category") or "default").strip().lower()
    distance = (request.args.get("distance") or "10").strip()
    lat = (request.args.get("lat") or "").strip()
    lon = (request.args.get("lon") or "").strip()

    if not keyword:
        return jsonify({"error": "keyword is required"}), 400
    if not lat or not lon:
        return jsonify({"error": "lat/lon are required"}), 400

    # lat/lon → geohash (precision 7 as in spec)
    try:
        geo_point = gh.encode(float(lat), float(lon), 7)
    except Exception:
        return jsonify({"error": "invalid lat/lon"}), 400

    params = {
        "apikey": TICKETMASTER_API_KEY,
        "keyword": keyword,
        "geoPoint": geo_point,
        "radius": distance or "10",
        "unit": "miles",
        "sort": "date,asc",
        "size": 20,
    }
    # apply category if not default
    seg = SEGMENT_IDS.get(category)
    if seg:
        params["segmentId"] = seg

    try:
        r = requests.get(TM_SEARCH_URL, params=params, timeout=12)
        r.raise_for_status()
        data = r.json()
    except requests.RequestException as e:
        return jsonify({"error": "ticketmaster request failed", "details": str(e)}), 502

    # Parse events safely
    events = []
    try:
        for ev in data.get("_embedded", {}).get("events", []):
            name = ev.get("name", "")
            date = (
                ev.get("dates", {}).get("start", {}).get("localDate")
                or ev.get("dates", {}).get("start", {}).get("dateTime")
                or ""
            )
            venue = ""
            venues = ev.get("_embedded", {}).get("venues", [])
            if venues:
                venue = venues[0].get("name", "")

            events.append({
                "name": name,
                "venue": venue,
                "date": date,
            })
    except Exception:
        # If parsing fails, fall back to empty list
        events = []

    return jsonify({"events": events})


@app.get("/health")
def health():
    return {"ok": True}


if __name__ == "__main__":
    # Run Flask; open http://127.0.0.1:8080/
    app.run(host="0.0.0.0", port=8080, debug=True)

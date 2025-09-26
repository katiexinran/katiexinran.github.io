"""
Flask backend for Events Search
- /search : Ticketmaster Discovery search (uses latlong + radius)
- /event  : Ticketmaster Event Details
- /venue  : Ticketmaster Venue Search
"""

import os
import requests
from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS

app = Flask(__name__, static_folder=".", static_url_path="")
CORS(app)

# ----------------- Config -----------------
# Read from env if present, otherwise use your key.
TICKETMASTER_API_KEY = os.environ.get(
    "TICKETMASTER_API_KEY",
    "w71ehIlQymxGnc42SoC5Mw7AXg2eKACY"
).strip()

TM_SEARCH_URL = "https://app.ticketmaster.com/discovery/v2/events.json"
TM_EVENT_URL  = "https://app.ticketmaster.com/discovery/v2/events/{id}.json"
TM_VENUES_URL = "https://app.ticketmaster.com/discovery/v2/venues.json"

# UI categories -> Ticketmaster segmentId
SEGMENT_IDS = {
    "music": "KZFzniwnSyZfZ7v7nJ",
    "sports": "KZFzniwnSyZfZ7v7nE",
    "arts": "KZFzniwnSyZfZ7v7na",      # Arts & Theatre
    "theatre": "KZFzniwnSyZfZ7v7na",
    "film": "KZFzniwnSyZfZ7v7nn",
    "miscellaneous": "KZFzniwnSyZfZ7v7n1",
}

# ----------------- Static file -----------------
@app.route("/")
@app.route("/events.html")
def home():
    return send_from_directory(".", "events.html")

# ----------------- Search -----------------
@app.get("/search")
def search():
    if not TICKETMASTER_API_KEY:
        return jsonify({"error": "Ticketmaster API key not configured"}), 500

    keyword  = (request.args.get("keyword")  or "").strip()
    distance = (request.args.get("distance") or "10").strip()
    category = (request.args.get("category") or "default").strip().lower()
    lat      = (request.args.get("lat")      or "").strip()
    lon      = (request.args.get("lon")      or "").strip()

    if not keyword:
        return jsonify({"error": "keyword is required"}), 400
    if not lat or not lon:
        return jsonify({"error": "lat/lon are required"}), 400

    # Build params using latlong instead of geoPoint
    params = {
        "apikey":   TICKETMASTER_API_KEY,
        "keyword":  keyword,
        "latlong":  f"{lat},{lon}",
        "radius":   distance or "10",
        "unit":     "miles",
        "size":     20,
        "sort":     "date,asc",
        "locale":   "*"              # avoid locale filtering
        # "includeTBA": "yes",
        # "includeTBD": "yes",
        # "includeTest": "no",
    }
    seg = SEGMENT_IDS.get(category)
    if seg:
        params["segmentId"] = seg

    try:
        resp = requests.get(TM_SEARCH_URL, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as e:
        return jsonify({"error": "ticketmaster request failed", "details": str(e)}), 502

    raw_events = (data.get("_embedded") or {}).get("events") or []
    events = []

    for ev in raw_events:
        # date/time
        start = (ev.get("dates") or {}).get("start") or {}
        d = (start.get("localDate") or "").strip()
        t = (start.get("localTime") or "").strip()
        date_str = f"{d} {t}".strip() if d or t else ""

        # image ~200px wide if possible
        img_url = ""
        imgs = ev.get("images") or []
        if imgs:
            img_url = sorted(imgs, key=lambda i: abs((i.get("width") or 9999) - 200))[0].get("url", "")

        # venue
        venue_name = ""
        venues = (ev.get("_embedded") or {}).get("venues") or []
        if venues:
            venue_name = venues[0].get("name") or ""

        # top-level segment as "genre" label (good enough for table)
        genre = ""
        cls = ev.get("classifications") or []
        if cls:
            genre = ((cls[0].get("segment") or {}).get("name") or "")

        events.append({
            "id":    ev.get("id") or "",
            "date":  date_str,
            "icon":  img_url,
            "event": ev.get("name") or "",
            "genre": genre,
            "venue": venue_name,
        })

    return jsonify({"events": events})

# ----------------- Event Details -----------------
@app.get("/event")
def event_details():
    if not TICKETMASTER_API_KEY:
        return jsonify({"error": "Ticketmaster API key not configured"}), 500

    eid = (request.args.get("id") or "").strip()
    if not eid:
        return jsonify({"error": "event id is required"}), 400

    try:
        r = requests.get(TM_EVENT_URL.format(id=eid),
                         params={"apikey": TICKETMASTER_API_KEY},
                         timeout=15)
        r.raise_for_status()
        ev = r.json()
    except requests.RequestException as e:
        return jsonify({"error": "event details request failed", "details": str(e)}), 502

    start = (ev.get("dates") or {}).get("start") or {}
    status_code = ((ev.get("dates") or {}).get("status") or {}).get("code", "")

    # genres (segment / genre / subGenre / type / subType)
    genres = []
    cls = ev.get("classifications") or []
    if cls:
        c = cls[0]
        for key in ("segment", "genre", "subGenre", "type", "subType"):
            name = (c.get(key) or {}).get("name")
            if name and name not in genres:
                genres.append(name)

    # artists
    artists = []
    for a in ((ev.get("_embedded") or {}).get("attractions") or []):
        artists.append({
            "name": a.get("name", "") or "",
            "url":  a.get("url", "") or ""
        })

    # venue name (for "Show Venue Details")
    venue_name = ""
    venues = ((ev.get("_embedded") or {}).get("venues") or [])
    if venues:
        venue_name = venues[0].get("name", "") or ""

    # price range string "min - max CURRENCY"
    price_str = ""
    pr = ev.get("priceRanges") or []
    if pr:
        p0 = pr[0]
        minp = p0.get("min")
        maxp = p0.get("max")
        cur  = p0.get("currency", "")
        if minp is not None and maxp is not None:
            price_str = f"{minp:g} - {maxp:g} {cur}".strip()

    out = {
        "id":         ev.get("id", "") or "",
        "name":       ev.get("name", "") or "",
        "date":       start.get("localDate", "") or "",
        "time":       start.get("localTime", "") or "",
        "status":     status_code or "",
        "genres":     genres,
        "artists":    artists,
        "venueName":  venue_name,
        "buyUrl":     ev.get("url", "") or "",
        "seatmap":    ((ev.get("seatmap") or {}).get("staticUrl") or ""),
        "priceRange": price_str,
    }
    return jsonify({"event": out})

# ----------------- Venue -----------------
@app.get("/venue")
def venue():
    if not TICKETMASTER_API_KEY:
        return jsonify({"error": "Ticketmaster API key not configured"}), 500

    kw = (request.args.get("keyword") or "").strip()
    if not kw:
        return jsonify({"error": "keyword is required"}), 400

    try:
        r = requests.get(TM_VENUES_URL,
                         params={"apikey": TICKETMASTER_API_KEY, "keyword": kw, "size": 1},
                         timeout=15)
        r.raise_for_status()
        data = r.json()
    except requests.RequestException as e:
        return jsonify({"error": "venue search failed", "details": str(e)}), 502

    v = ((data.get("_embedded") or {}).get("venues") or [])
    if not v:
        return jsonify({"venue": None})

    v0 = v[0]
    venue_out = {
        "name":       v0.get("name") or "N/A",
        "address":    (v0.get("address") or {}).get("line1") or "N/A",
        "city":       (v0.get("city") or {}).get("name") or "N/A",
        "state":      (v0.get("state") or {}).get("stateCode") or "N/A",
        "postalCode": v0.get("postalCode") or "N/A",
        "url":        v0.get("url") or "",
        "image":      (v0.get("images", [{}])[0].get("url") if v0.get("images") else ""),
    }
    return jsonify({"venue": venue_out})

# ----------------- Health -----------------
@app.get("/health")
def health():
    return {"ok": True}

if __name__ == "__main__":
    # You can also export TICKETMASTER_API_KEY in your environment instead of hardcoding it.
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)), debug=True)

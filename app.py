from flask import Flask, request, jsonify
from flask_cors import CORS
import os, requests

app = Flask(__name__)
CORS(app)

# Put your key in an env var for safety:
TM_API_KEY = os.environ.get("TM_API_KEY", "REPLACE_ME")  # <<< set in your shell

TM_BASE = "https://app.ticketmaster.com/discovery/v2/events.json"

def build_tm_params(keyword, distance, category, lat, lon):
    p = {
        "apikey": TM_API_KEY,
        "keyword": keyword,
        "radius": distance,
        "unit": "miles",
        # you can also use 'geoPoint' (geohash). The assignment allows either.
        "latlong": f"{lat},{lon}",
        "sort": "date,asc",
        "size": 50,
    }
    # "Default" = no category filter
    if category and category.lower() != "default":
        # Ticketmaster accepts classificationName (e.g., "Music", "Sports", "Arts & Theatre", "Film", "Miscellaneous")
        p["classificationName"] = category
    return p

@app.get("/api/events")
def search_events():
    keyword  = request.args.get("keyword", "").strip()
    distance = request.args.get("distance", "10").strip()
    category = request.args.get("category", "Default").strip()
    lat      = request.args.get("lat")
    lon      = request.args.get("lon")

    if not keyword:
        return jsonify({"error": "keyword required"}), 400
    if not lat or not lon:
        return jsonify({"error": "lat/lon required"}), 400

    try:
        params = build_tm_params(keyword, distance, category, lat, lon)
        r = requests.get(TM_BASE, params=params, timeout=12)
        r.raise_for_status()
        data = r.json()

        # Normalize a small, clean payload for the UI
        events = []
        embedded = data.get("_embedded", {})
        for ev in embedded.get("events", []):
            obj = {
                "id": ev.get("id"),
                "name": ev.get("name"),
                "url": ev.get("url"),
                "date": (ev.get("dates", {}).get("start", {}).get("localDate")),
                "time": (ev.get("dates", {}).get("start", {}).get("localTime")),
                "venue": None,
                "genre": None
            }
            # venue
            venues = ev.get("_embedded", {}).get("venues", [])
            if venues:
                obj["venue"] = venues[0].get("name")

            # genre/classification
            classif = ev.get("classifications", [])
            if classif:
                seg = classif[0].get("segment", {}).get("name")
                gen = classif[0].get("genre", {}).get("name")
                obj["genre"] = " • ".join(filter(None, [seg, gen]))

            events.append(obj)

        return jsonify({"count": len(events), "events": events})
    except requests.HTTPError as e:
        return jsonify({"error": f"Ticketmaster HTTP {e.response.status_code}",
                        "detail": e.response.text[:400]}), 502
    except Exception as e:
        return jsonify({"error": "server_error", "detail": str(e)}), 500


if __name__ == "__main__":
    # export TM_API_KEY=your_key_here  (Mac: in the same terminal)
    app.run(host="127.0.0.1", port=5000, debug=True)
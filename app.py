# app.py
import requests
from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

@app.route('/')
def home():
    return send_from_directory('.', 'events.html')

@app.route('/events.html')
def events_page():
    return send_from_directory('.', 'events.html')

# --- Google Geocoding route ---
GOOGLE_GEOCODE_KEY = "AIzaSyAlIwx5AicjUiJge-ati0zNs8mfYq2BY2w"

@app.get('/api/geocode')
def geocode():
    addr = request.args.get('address', '').strip()
    if not addr:
        return jsonify({'error': 'address is required'}), 400
    url = 'https://maps.googleapis.com/maps/api/geocode/json'
    params = {'address': addr, 'key': GOOGLE_GEOCODE_KEY}
    r = requests.get(url, params=params, timeout=10)
    data = r.json()
    if data.get('status') != 'OK':
        return jsonify({'error': 'geocoding failed', 'details': data.get('status')}), 400
    loc = data['results'][0]['geometry']['location']  # {'lat': .., 'lng': ..}
    return jsonify({'lat': loc['lat'], 'lng': loc['lng']})

@app.get('/health')
def health():
    return {'ok': True}

if __name__ == '__main__':
    app.run(debug=True)

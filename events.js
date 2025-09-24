/* ===============================
   Client-side behavior for A2
   =============================== */

// ---------- Config ----------
const IPINFO_TOKEN = "3d5aa08629e9e7";          // OK to call directly per spec
const GOOGLE_GEOCODE_KEY = "YOUR_GOOGLE_KEY_HERE"; // replace in your local env

// ---------- Elements ----------
const form          = document.getElementById("searchForm");
const keywordInput  = document.getElementById("keyword");
const distanceInput = document.getElementById("distance");
const categorySel   = document.getElementById("category");
const locationInput = document.getElementById("location");
const autoDetect    = document.getElementById("autoDetect");
const autoStatus    = document.getElementById("autoStatus");
const latHidden     = document.getElementById("lat");
const lonHidden     = document.getElementById("lon");
const clearButton   = document.getElementById("clearButton");

// Results UI
const resultsSection   = document.getElementById("resultsSection");
const loadingEl        = document.getElementById("loading");
const errorEl          = document.getElementById("error");
const emptyEl          = document.getElementById("empty");
const resultsTableWrap = document.getElementById("resultsTableWrap");

// ---------- Helpers ----------
async function getIpLocation() {
  const res = await fetch(`https://ipinfo.io/json?token=${IPINFO_TOKEN}`);
  if (!res.ok) throw new Error(`IPInfo HTTP ${res.status}`);
  const data = await res.json();
  if (!data.loc) throw new Error("No 'loc' in IPInfo response");
  const [lat, lon] = data.loc.split(",").map(Number);
  return { lat, lon, city: data.city, region: data.region, country: data.country };
}

async function geocodeAddress(address) {
  const url =
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_GEOCODE_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocode HTTP ${res.status}`);
  const data = await res.json();
  if (data.status !== "OK" || !data.results.length) {
    throw new Error(`Geocode failed: ${data.status}`);
  }
  const loc = data.results[0].geometry.location;
  return { lat: loc.lat, lon: loc.lng };
}

function setManualLocationMode() {
  locationInput.style.display = "block";
  locationInput.required = true;
  autoStatus.textContent = "";
  latHidden.value = "";
  lonHidden.value = "";
}

function setAutoDetectMode() {
  locationInput.style.display = "none";
  locationInput.required = false;
}

function showLoading() {
  resultsSection.classList.remove("hidden");
  loadingEl.classList.remove("hidden");
  errorEl.classList.add("hidden");
  emptyEl.classList.add("hidden");
  resultsTableWrap.classList.add("hidden");
}

function showError(msg) {
  resultsSection.classList.remove("hidden");
  loadingEl.classList.add("hidden");
  resultsTableWrap.classList.add("hidden");
  emptyEl.classList.add("hidden");
  errorEl.textContent = msg;
  errorEl.classList.remove("hidden");
}

function showEmpty() {
  resultsSection.classList.remove("hidden");
  loadingEl.classList.add("hidden");
  resultsTableWrap.classList.add("hidden");
  errorEl.classList.add("hidden");
  emptyEl.classList.remove("hidden");
}

function showTable(html) {
  resultsSection.classList.remove("hidden");
  loadingEl.classList.add("hidden");
  errorEl.classList.add("hidden");
  emptyEl.classList.add("hidden");
  resultsTableWrap.innerHTML = html;
  resultsTableWrap.classList.remove("hidden");
}

function buildResultsTable(items) {
  // items: [{name, venue, date}]
  const rows = items.map(it => `
    <tr>
      <td>${escapeHtml(it.name)}</td>
      <td>${escapeHtml(it.venue || "-")}</td>
      <td>${escapeHtml(it.date || "-")}</td>
    </tr>
  `).join("");

  return `
    <table aria-label="Search results">
      <thead>
        <tr><th>Event</th><th>Venue</th><th>Date</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function escapeHtml(s = "") {
  return s.replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

// ---------- Distance "placeholder" look while value=10 ----------
distanceInput.value = "10";
distanceInput.classList.add("as-placeholder");
distanceInput.addEventListener("input", () => {
  distanceInput.classList.remove("as-placeholder");
});

// ---------- Checkbox toggle ----------
autoDetect.addEventListener("change", async () => {
  if (autoDetect.checked) {
    setAutoDetectMode();
    autoStatus.textContent = "Detecting location…";
    try {
      const info = await getIpLocation();
      latHidden.value = String(info.lat);
      lonHidden.value = String(info.lon);
      autoStatus.textContent = `Detected: ${info.city ?? ""} ${info.region ?? ""}`.trim();
    } catch {
      autoStatus.textContent = "Could not detect location. Please enter it manually.";
      autoDetect.checked = false;
      setManualLocationMode();
    }
  } else {
    setManualLocationMode();
  }
});

// ---------- Form submit ----------
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Sync required state based on checkbox
  autoDetect.checked ? setAutoDetectMode() : setManualLocationMode();

  // Native browser tooltip for missing required fields
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  // resolve coordinates
  let lat, lon;
  try {
    if (autoDetect.checked) {
      if (!latHidden.value || !lonHidden.value) {
        const info = await getIpLocation();
        lat = info.lat; lon = info.lon;
      } else {
        lat = Number(latHidden.value);
        lon = Number(lonHidden.value);
      }
    } else {
      const address = locationInput.value.trim();
      const coords = await geocodeAddress(address);
      lat = coords.lat; lon = coords.lon;
      latHidden.value = String(lat);
      lonHidden.value = String(lon);
    }
  } catch {
    showError("Unable to resolve your location. Please try again.");
    return;
  }

  // Build query (Distance defaults to 10, Category to default)
  const params = new URLSearchParams({
    keyword : keywordInput.value.trim(),
    distance: (distanceInput.value || "10").trim(),
    category: (categorySel.value || "default").trim(),
    lat     : String(lat),
    lon     : String(lon)
  });

    showLoading();

    try {
    const resp = await fetch(`/search?${params.toString()}`, { method: "GET" });

    // Try to parse JSON either on success or error
    let payload = {};
    try { payload = await resp.json(); } catch (_) { /* non-JSON error */ }

    if (!resp.ok) {
        const msg = (payload && payload.error) ? payload.error
                : (payload && payload.details) ? payload.details
                : `HTTP ${resp.status}`;
        showError(String(msg));
        console.error("Search failed:", payload);
        return;
    }

    const items = Array.isArray(payload.events) ? payload.events : [];
    if (items.length === 0) {
        showEmpty();
        return;
    }

    showTable(buildResultsTable(items));

    } catch (err) {
    console.error(err);
    showError("Network error. Please try again.");
    }
});

// ---------- Clear ----------
clearButton.addEventListener("click", () => {
  form.reset();
  // Show location back; clear hidden coords and results
  setManualLocationMode();
  latHidden.value = ""; lonHidden.value = "";
  resultsSection.classList.add("hidden");
  errorEl.classList.add("hidden");
  emptyEl.classList.add("hidden");
  resultsTableWrap.classList.add("hidden");
  loadingEl.classList.add("hidden");

  // restore distance "placeholder" look
  distanceInput.value = "10";
  distanceInput.classList.add("as-placeholder");
});

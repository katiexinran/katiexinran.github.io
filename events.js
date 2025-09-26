// Search + results + event/venue details with color-coded ticket status.

// ======= CONFIG =======
const IPINFO_TOKEN = "3d5aa08629e9e7";

// Read Google Geocoding key from the meta tag you added in <head>
const GOOGLE_KEY =
  document.querySelector('meta[name="google-maps-key"]')?.content ||
  window.GOOGLE_MAPS_API_KEY || "";

// ======= FORM ELEMENTS =======
const form = document.getElementById("searchForm");
const keywordInput = document.getElementById("keyword");
const distanceInput = document.getElementById("distance");
const categorySel = document.getElementById("category");
const locationInput = document.getElementById("location");
const autoDetect = document.getElementById("autoDetect");
const autoStatus = document.getElementById("autoStatus");
const latHidden = document.getElementById("lat");
const lonHidden = document.getElementById("lon");
const clearButton = document.getElementById("clearButton");

// ======= RESULTS / DETAIL ELEMENTS =======
const resultsSection = document.getElementById("resultsSection");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");
const emptyEl = document.getElementById("empty");
const resultsTableWrap = document.getElementById("resultsTableWrap");
const detailsCard = document.getElementById("detailsCard");
const venueCard = document.getElementById("venueCard");
const venueToggleBar = document.getElementById("venueToggleBar"); // <— missing before

// ======= STATE =======
let currentItems = [];
let sortState = { key: null, dir: "asc" };

// ======= HELPERS =======
function escapeHtml(s = "") {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}

function formatDate(dstr = "") {
  if (!dstr) return "-";
  const [d, t] = dstr.split(" ");
  return t ? `${d}<br>${t}` : d;
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

// ---- IP-based location ----
async function getIpLocation() {
  const res = await fetch(`https://ipinfo.io/json?token=${IPINFO_TOKEN}`);
  if (!res.ok) throw new Error(`IPInfo HTTP ${res.status}`);
  const data = await res.json();
  const [lat, lon] = (data.loc || "").split(",").map(Number);
  if (!lat && !lon) throw new Error("no loc");
  return { lat, lon, city: data.city, region: data.region };
}

// ---- Google Geocoding ----
async function geocodeAddress(address) {
  if (!GOOGLE_KEY) {
    throw new Error("Missing Google Maps Geocoding API key");
  }
  const url =
    "https://maps.googleapis.com/maps/api/geocode/json?address=" +
    encodeURIComponent(address) +
    "&key=" +
    encodeURIComponent(GOOGLE_KEY);

  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding request failed");
  const data = await res.json();

  if (data.status !== "OK" || !data.results || !data.results.length) {
    throw new Error("GEOCODE_ZERO_RESULTS");
  }
  const { lat, lng } = data.results[0].geometry.location;
  return { lat, lon: lng, formatted: data.results[0].formatted_address };
}

// ======= UI STATE HELPERS =======
function showLoading() {
  resultsSection.classList.remove("hidden");
  loadingEl.classList.remove("hidden");
  errorEl.classList.add("hidden");
  emptyEl.classList.add("hidden");
  resultsTableWrap.classList.add("hidden");
  detailsCard.classList.add("hidden");
  venueCard.classList.add("hidden");
}

function showError(msg) {
  resultsSection.classList.remove("hidden");
  loadingEl.classList.add("hidden");
  errorEl.textContent = msg;
  errorEl.classList.remove("hidden");
  emptyEl.classList.add("hidden");
  resultsTableWrap.classList.add("hidden");
  detailsCard.classList.add("hidden");
  venueCard.classList.add("hidden");
}

function showEmpty() {
  resultsSection.classList.remove("hidden");
  loadingEl.classList.add("hidden");
  emptyEl.classList.remove("hidden");
  errorEl.classList.add("hidden");
  resultsTableWrap.classList.add("hidden");
  detailsCard.classList.add("hidden");
  venueCard.classList.add("hidden");
}

function renderTable() {
  resultsTableWrap.innerHTML = buildResultsTable(currentItems, sortState);
  resultsTableWrap.classList.remove("hidden");
  loadingEl.classList.add("hidden");
  errorEl.classList.add("hidden");
  emptyEl.classList.add("hidden");
  detailsCard.classList.add("hidden");
  venueCard.classList.add("hidden");
  attachResultHandlers();
}

// ======= TABLE RENDER + SORTING =======
function buildResultsTable(items, sort) {
  const rows = items.map((it) => `
    <tr>
      <td class="date-cell">${formatDate(it.date)}</td>
      <td class="img-cell">${
        it.icon ? `<img src="${escapeHtml(it.icon)}" alt="${escapeHtml(it.event)} icon">` : "-"
      }</td>
      <td>${
        it.id
          ? `<a href="#" class="event-link" data-eid="${it.id}" data-vname="${escapeHtml(it.venue)}">${escapeHtml(it.event)}</a>`
          : escapeHtml(it.event)
      }</td>
      <td>${escapeHtml(it.genre || "-")}</td>
      <td>${escapeHtml(it.venue || "-")}</td>
    </tr>
  `).join("");

  const evClass  = sort.key === "event" ? `sorted-${sort.dir}` : "";
  const genClass = sort.key === "genre" ? `sorted-${sort.dir}` : "";
  const venClass = sort.key === "venue" ? `sorted-${sort.dir}` : "";

  return `
    <table aria-label="Search results">
      <thead>
        <tr>
          <th>Date</th>
          <th>Icon</th>
          <th class="sortable ${evClass}" data-key="event">Event</th>
          <th class="sortable ${genClass}" data-key="genre">Genre</th>
          <th class="sortable ${venClass}" data-key="venue">Venue</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function attachResultHandlers() {
  resultsTableWrap.querySelectorAll("th.sortable").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.dataset.key;
      if (sortState.key === key) sortState.dir = sortState.dir === "asc" ? "desc" : "asc";
      else { sortState.key = key; sortState.dir = "asc"; }
      sortCurrent(); renderTable();
    });
  });

  resultsTableWrap.addEventListener("click", async (e) => {
    const a = e.target.closest(".event-link");
    if (!a) return;
    e.preventDefault();
    await fetchAndShowDetails(a.dataset.eid, a.dataset.vname || "");
  });
}

function sortCurrent() {
  const k = sortState.key; if (!k) return;
  currentItems.sort((a, b) => {
    const av = String(a[k] ?? "").toLowerCase();
    const bv = String(b[k] ?? "").toLowerCase();
    if (av < bv) return sortState.dir === "asc" ? -1 : 1;
    if (av > bv) return sortState.dir === "asc" ? 1 : -1;
    return 0;
  });
}

// ======= DETAILS (EVENT + VENUE) =======
async function fetchAndShowDetails(eventId, venueNameFromRow) {
  try {
    const resp = await fetch(`/event?id=${encodeURIComponent(eventId)}`);
    const data = await resp.json();
    if (!resp.ok) { showError(data.error || `HTTP ${resp.status}`); return; }
    renderEventDetails(data.event, venueNameFromRow || data.event.venueName);
    detailsCard.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    console.error(err);
    showError("Failed to load event details.");
  }
}

function statusToClass(code) {
  const c = String(code || "").toLowerCase();
  if (c.includes("onsale")) return "green";
  if (c.includes("offsale")) return "red";
  if (c.includes("canceled") || c.includes("cancelled")) return "black";
  if (c.includes("postponed") || c.includes("rescheduled")) return "orange";
  return "";
}
function niceStatus(code) {
  const m = String(code || "");
  if (/on.?sale/i.test(m)) return "On Sale";
  if (/off.?sale/i.test(m)) return "Off Sale";
  if (/cancell?ed/i.test(m)) return "Canceled";
  if (/postponed/i.test(m)) return "Postponed";
  if (/rescheduled/i.test(m)) return "Rescheduled";
  return m;
}
function row(label, val, cls = "") {
  return `
    <div class="row ${cls}">
      <div class="label">${label}</div>
      <div class="value">${val}</div>
    </div>
  `;
}

function renderEventDetails(ev, venueNameForToggle){
  const dateStr = [ev.date, ev.time].filter(Boolean).join(" ");
  const artists = (ev.artists||[]).map(a =>
    a.url ? `<a href="${escapeHtml(a.url)}" target="_blank" rel="noopener">${escapeHtml(a.name)}</a>` : escapeHtml(a.name)
  ).join(" | ");
  const genres   = (ev.genres||[]).join(" | ");
  const pillClass = statusToClass(ev.status);
  const pillHtml  = ev.status ? `<span class="pill ${pillClass}">${escapeHtml(niceStatus(ev.status))}</span>` : "";

  const rows = [];
  if (dateStr) rows.push(row("Date", dateStr));
  if (artists) rows.push(row("Artist/Team", artists, "artists"));
  if (ev.venueName || venueNameForToggle) rows.push(row("Venue", escapeHtml(ev.venueName || venueNameForToggle)));
  if (genres) rows.push(row("Genres", escapeHtml(genres)));
  if (ev.priceRange) rows.push(row("Price Ranges", escapeHtml(ev.priceRange)));
  if (pillHtml) rows.push(row("Ticket Status", pillHtml));
  if (ev.buyUrl) rows.push(row("Buy Ticket At", `<a href="${escapeHtml(ev.buyUrl)}" target="_blank" rel="noopener">Ticketmaster</a>`));

  const right = ev.seatmap ? `<div class="seatmap"><img src="${escapeHtml(ev.seatmap)}" alt="Seat map"></div>` : "";

  detailsCard.innerHTML = `
    <div class="title">${escapeHtml(ev.name || "-")}</div>
    <div class="layout">
      <div class="left">${rows.join("")}</div>
      ${right ? `<div class="right">${right}</div>` : ""}
    </div>
  `;
  detailsCard.classList.remove("hidden");
  venueCard.classList.add("hidden");

  if (venueNameForToggle) {
    venueToggleBar.innerHTML = `
      <button type="button" id="venueToggleBtn" class="venue-toggle-btn">
        Show Venue Details <span class="chev">⌄</span>
      </button>
    `;
    venueToggleBar.classList.remove("hidden");
    document.getElementById("venueToggleBtn").onclick = async () => {
      venueToggleBar.classList.add("hidden");
      await fetchAndShowVenue(venueNameForToggle);
      venueCard.scrollIntoView({ behavior: "smooth", block: "start" });
    };
  } else {
    venueToggleBar.classList.add("hidden");
    venueToggleBar.innerHTML = "";
  }
}

async function fetchAndShowVenue(name) {
  try {
    const resp = await fetch(`/venue?keyword=${encodeURIComponent(name)}`);
    const data = await resp.json();
    if (!resp.ok) { showError(data.error || `HTTP ${resp.status}`); return; }
    renderVenueCard(data.venue, name);
    venueCard.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    console.error(err);
    showError("Failed to load venue details.");
  }
}

function renderVenueCard(v, fallbackName){
  if(!v){
    venueCard.innerHTML = "";
    venueCard.classList.add("hidden");
    return;
  }

  const fullName   = v.name || fallbackName || "N/A";
  const line1      = v.address || "N/A";
  const cityState  = [v.city || "N/A", v.state || "N/A"].join(", ");
  const postal     = v.postalCode || "N/A";
  const fullAddrQ  = `${fullName}, ${line1}, ${cityState}, ${postal}`.replace(/\s+,/g, ",").trim();
  const gmapsHref  = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddrQ)}`;
  const moreHref   = v.url || "";
  const logoUrl    = v.image || ""; // <- Ticketmaster venue image (logo if available)

  venueCard.innerHTML = `
  <div class="venue-shell">
    <div class="venue-card">
      <div class="venue-header">
        <div class="vname">${escapeHtml(fullName)}</div>
        ${v.image ? `<img class="venue-logo" src="${escapeHtml(v.image)}" alt="${escapeHtml(fullName)} logo">` : ""}
      </div>

      <div class="venue-body">
        <!-- Left column -->
        <div class="venue-info">
          <div class="address-row">
            <div class="label">Address:</div>
            <div class="addr-lines">
              ${escapeHtml(line1)}<br>
              ${escapeHtml(cityState)}<br>
              ${escapeHtml(postal)}
            </div>
          </div>
          <a class="gmaps" href="${gmapsHref}" target="_blank" rel="noopener">Open in Google Maps</a>
        </div>

        <!-- Right column -->
        <div class="venue-links">
          ${moreHref ? `<a href="${escapeHtml(moreHref)}" target="_blank" rel="noopener">More events at this venue</a>` : ""}
        </div>
      </div>
    </div>
  </div>
`;

  venueCard.classList.remove("hidden");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  autoDetect.checked ? setAutoDetectMode() : setManualLocationMode();
  if (!form.checkValidity()) { form.reportValidity(); return; }

  let lat, lon;
  try {
    if (autoDetect.checked) {
      if (!latHidden.value || !lonHidden.value) {
        const info = await getIpLocation(); lat = info.lat; lon = info.lon;
      } else {
        lat = Number(latHidden.value); lon = Number(lonHidden.value);
      }
    } else {
      const addr = locationInput.value.trim();
      const coords = await geocodeAddress(addr);
      lat = coords.lat; lon = coords.lon;
      latHidden.value = String(lat); lonHidden.value = String(lon);
    }
  } catch {
    showError("Unable to resolve your location. Please try again.");
    return;
  }

  const params = new URLSearchParams({
    keyword:  keywordInput.value.trim(),
    distance: (distanceInput.value || "10").trim(),
    category: (categorySel.value || "default").trim(),
    lat: String(lat),
    lon: String(lon),
  });

  showLoading();
  try {
    const resp = await fetch(`/search?${params.toString()}`, { method: "GET" });
    let payload = {}; try { payload = await resp.json(); } catch {}
    if (!resp.ok) { showError(payload.error || payload.details || `HTTP ${resp.status}`); return; }

    currentItems = Array.isArray(payload.events) ? payload.events.slice(0, 20) : [];
    if (currentItems.length === 0) { showEmpty(); return; }

    sortState = { key: null, dir: "asc" };
    renderTable();
  } catch (err) {
    console.error(err);
    showError("Network error. Please try again.");
  }
});

clearButton.addEventListener("click", () => {
  form.reset();
  setManualLocationMode();
  latHidden.value = ""; lonHidden.value = "";
  resultsSection.classList.add("hidden");
  errorEl.classList.add("hidden");
  emptyEl.classList.add("hidden");
  resultsTableWrap.classList.add("hidden");
  loadingEl.classList.add("hidden");
  detailsCard.classList.add("hidden");
  venueCard.classList.add("hidden");
  distanceInput.value = "10";
  distanceInput.classList.add("as-placeholder");
  currentItems = []; sortState = { key: null, dir: "asc" };
});

// --- Make the default "10" appear dark gray until edited ---
document.addEventListener("DOMContentLoaded", () => {
  // Gray on first paint if it's still the default "10"
  if (distanceInput.value === "" || distanceInput.value === "10") {
    distanceInput.classList.add("as-placeholder");
  }

  let hasEditedDistance = false;

  const reflectPlaceholder = () => {
    // Once the user edits, keep it white regardless of the number
    if (hasEditedDistance) {
      distanceInput.classList.remove("as-placeholder");
      return;
    }
    // Before the first edit, keep gray only for the default
    if (distanceInput.value === "" || distanceInput.value === "10") {
      distanceInput.classList.add("as-placeholder");
    } else {
      distanceInput.classList.remove("as-placeholder");
    }
  };

  distanceInput.addEventListener("input", () => {
    hasEditedDistance = true;
    reflectPlaceholder();
  });

  distanceInput.addEventListener("change", reflectPlaceholder);
  distanceInput.addEventListener("blur", () => {
    if (distanceInput.value === "") distanceInput.value = "10";
    reflectPlaceholder();
  });

  // When the user hits CLEAR, restore the gray default
  clearButton.addEventListener("click", () => {
    hasEditedDistance = false;
    distanceInput.value = "10";
    distanceInput.classList.add("as-placeholder");
  });
});

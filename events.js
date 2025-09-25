// Search + results + event/venue details with color-coded ticket status.

const IPINFO_TOKEN = "3d5aa08629e9e7";
const GOOGLE_GEOCODE_KEY = "YOUR_GOOGLE_KEY_HERE";

// Form elements
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

// Results + detail containers
const resultsSection = document.getElementById("resultsSection");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");
const emptyEl = document.getElementById("empty");
const resultsTableWrap = document.getElementById("resultsTableWrap");
const detailsCard = document.getElementById("detailsCard");
const venueCard = document.getElementById("venueCard");

let currentItems = [];
let sortState = { key: null, dir: "asc" };

/* ---------------- helpers ---------------- */
async function getIpLocation(){
  const res = await fetch(`https://ipinfo.io/json?token=${IPINFO_TOKEN}`);
  if(!res.ok) throw new Error(`IPInfo HTTP ${res.status}`);
  const data = await res.json();
  const [lat, lon] = (data.loc || "").split(",").map(Number);
  if(!lat && !lon) throw new Error("no loc");
  return { lat, lon, city:data.city, region:data.region };
}
async function geocodeAddress(address){
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_GEOCODE_KEY}`;
  const res = await fetch(url);
  if(!res.ok) throw new Error(`Geocode HTTP ${res.status}`);
  const data = await res.json();
  if(data.status!=="OK" || !data.results.length) throw new Error("geocode failed");
  const loc = data.results[0].geometry.location;
  return { lat: loc.lat, lon: loc.lng };
}
function escapeHtml(s=""){ return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function formatDate(dstr=""){ if(!dstr) return "-"; const [d,t]=dstr.split(" "); return t?`${d}<br>${t}`:d; }
function setManualLocationMode(){ locationInput.style.display="block"; locationInput.required=true; autoStatus.textContent=""; latHidden.value=""; lonHidden.value=""; }
function setAutoDetectMode(){ locationInput.style.display="none"; locationInput.required=false; }

/* ---------------- UI state helpers ---------------- */
function showLoading(){
  resultsSection.classList.remove("hidden");
  loadingEl.classList.remove("hidden");
  errorEl.classList.add("hidden"); emptyEl.classList.add("hidden");
  resultsTableWrap.classList.add("hidden");
  detailsCard.classList.add("hidden"); venueCard.classList.add("hidden");
}
function showError(msg){
  resultsSection.classList.remove("hidden");
  loadingEl.classList.add("hidden");
  errorEl.textContent = msg;
  errorEl.classList.remove("hidden");
  emptyEl.classList.add("hidden");
  resultsTableWrap.classList.add("hidden");
  detailsCard.classList.add("hidden"); venueCard.classList.add("hidden");
}
function showEmpty(){
  resultsSection.classList.remove("hidden");
  loadingEl.classList.add("hidden");
  emptyEl.classList.remove("hidden");
  errorEl.classList.add("hidden");
  resultsTableWrap.classList.add("hidden");
  detailsCard.classList.add("hidden"); venueCard.classList.add("hidden");
}
function renderTable(){
  resultsTableWrap.innerHTML = buildResultsTable(currentItems, sortState);
  resultsTableWrap.classList.remove("hidden");
  loadingEl.classList.add("hidden");
  errorEl.classList.add("hidden"); emptyEl.classList.add("hidden");
  detailsCard.classList.add("hidden"); venueCard.classList.add("hidden");
  attachResultHandlers();
}

/* ---------------- Table render + sorting ---------------- */
function buildResultsTable(items, sort){
  const rows = items.map(it => `
    <tr>
      <td class="date-cell">${formatDate(it.date)}</td>
      <td class="img-cell">${it.icon ? `<img src="${escapeHtml(it.icon)}" alt="${escapeHtml(it.event)} icon">` : "-"}</td>
      <td>${it.id ? `<a href="#" class="event-link" data-eid="${it.id}" data-vname="${escapeHtml(it.venue)}">${escapeHtml(it.event)}</a>` : escapeHtml(it.event)}</td>
      <td>${escapeHtml(it.genre || "-")}</td>
      <td>${escapeHtml(it.venue || "-")}</td>
    </tr>
  `).join("");

  const evClass  = sort.key==="event" ? `sorted-${sort.dir}` : "";
  const genClass = sort.key==="genre" ? `sorted-${sort.dir}` : "";
  const venClass = sort.key==="venue" ? `sorted-${sort.dir}` : "";

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
function attachResultHandlers(){
  // sort headers
  resultsTableWrap.querySelectorAll("th.sortable").forEach(th=>{
    th.addEventListener("click",()=>{
      const key = th.dataset.key;
      if(sortState.key===key) sortState.dir = sortState.dir==="asc"?"desc":"asc";
      else { sortState.key=key; sortState.dir="asc"; }
      sortCurrent(); renderTable();
    });
  });
  // event click
  resultsTableWrap.addEventListener("click", async (e)=>{
    const a = e.target.closest(".event-link");
    if(!a) return;
    e.preventDefault();
    await fetchAndShowDetails(a.dataset.eid, a.dataset.vname || "");
  });
}
function sortCurrent(){
  const k = sortState.key; if(!k) return;
  currentItems.sort((a,b)=>{
    const av = String(a[k] ?? "").toLowerCase();
    const bv = String(b[k] ?? "").toLowerCase();
    if(av<bv) return sortState.dir==="asc"?-1:1;
    if(av>bv) return sortState.dir==="asc"?1:-1;
    return 0;
  });
}

/* ---------------- Details (Event + Venue) ---------------- */
async function fetchAndShowDetails(eventId, venueNameFromRow){
  try{
    const resp = await fetch(`/event?id=${encodeURIComponent(eventId)}`);
    const data = await resp.json();
    if(!resp.ok){ showError(data.error || `HTTP ${resp.status}`); return; }
    renderEventDetails(data.event, venueNameFromRow || data.event.venueName);
    detailsCard.scrollIntoView({behavior:"smooth", block:"start"});
  }catch(err){ console.error(err); showError("Failed to load event details."); }
}

function statusToClass(code){
  const c = String(code||"").toLowerCase();
  if(c.includes("onsale")) return "green";
  if(c.includes("offsale")) return "red";
  if(c.includes("canceled") || c.includes("cancelled")) return "black";
  if(c.includes("postponed") || c.includes("rescheduled")) return "orange";
  return "";
}

function renderEventDetails(ev, venueNameForToggle){
  const dateStr = [ev.date, ev.time].filter(Boolean).join(" ");
  const artists = (ev.artists||[]).map(a=> a.url ? `<a href="${escapeHtml(a.url)}" target="_blank" rel="noopener">${escapeHtml(a.name)}</a>` : escapeHtml(a.name)).join(" | ");
  const genres = (ev.genres||[]).join(" | ");
  const pillClass = statusToClass(ev.status);
  const pillHtml = ev.status ? `<span class="pill ${pillClass}">${escapeHtml(niceStatus(ev.status))}</span>` : "";

  // Build rows; skip empty fields (per spec)
  const rows = [];
  if(dateStr) rows.push(row("Date", dateStr));
  if(artists) rows.push(row("Artist/Team", artists, "artists"));
  if(venueNameForToggle) rows.push(row("Venue", escapeHtml(venueNameForToggle)));
  if(genres) rows.push(row("Genres", escapeHtml(genres)));
  if(ev.priceRange) rows.push(row("Price Ranges", escapeHtml(ev.priceRange)));
  if(pillHtml) rows.push(row("Ticket Status", pillHtml));
  if(ev.buyUrl) rows.push(row("Buy Ticket At", `<a href="${escapeHtml(ev.buyUrl)}" target="_blank" rel="noopener">Ticketmaster</a>`));

  const right = ev.seatmap ? `<div class="seatmap"><img src="${escapeHtml(ev.seatmap)}" alt="Seat map"></div>` : "";

  detailsCard.innerHTML = `
    <div class="details">
      <div class="title">${escapeHtml(ev.name || "-")}</div>
      <div class="layout">
        <div class="left">${rows.join("")}</div>
        ${right ? `<div class="right">${right}</div>` : ""}
      </div>
      ${venueNameForToggle ? `
        <div id="venueToggle" class="venue-toggle">
          <div>Show Venue Details</div>
          <span class="chev">⌄</span>
        </div>` : ""}
    </div>
  `;
  detailsCard.classList.remove("hidden");
  venueCard.classList.add("hidden"); // clear any previous venue card

  const toggle = document.getElementById("venueToggle");
  if(toggle){
    toggle.addEventListener("click", async ()=>{
      toggle.remove(); // hide the toggle once clicked
      await fetchAndShowVenue(venueNameForToggle);
    });
  }
}

function row(label, val, cls=""){
  return `
    <div class="row ${cls}">
      <div class="label">${label}</div>
      <div class="value">${val}</div>
    </div>
  `;
}
function niceStatus(code){
  const m = String(code||"");
  if(/on.?sale/i.test(m)) return "On Sale";
  if(/off.?sale/i.test(m)) return "Off Sale";
  if(/cancell?ed/i.test(m)) return "Canceled";
  if(/postponed/i.test(m)) return "Postponed";
  if(/rescheduled/i.test(m)) return "Rescheduled";
  return m;
}

async function fetchAndShowVenue(name){
  try{
    const resp = await fetch(`/venue?keyword=${encodeURIComponent(name)}`);
    const data = await resp.json();
    if(!resp.ok){ showError(data.error || `HTTP ${resp.status}`); return; }
    renderVenueCard(data.venue, name);
    venueCard.scrollIntoView({behavior:"smooth", block:"start"});
  }catch(err){ console.error(err); showError("Failed to load venue details."); }
}
function renderVenueCard(v, fallbackName){
  if(!v){
    venueCard.innerHTML = "";
    venueCard.classList.add("hidden");
    return;
  }
  const fullName = v.name || fallbackName || "N/A";
  const cityState = [v.city || "N/A", v.state || "N/A"].join(", ");
  const fullAddr = `${fullName}, ${v.address || ""}, ${cityState}, ${v.postalCode || ""}`.replace(/\s+,/g,",").trim();
  const gmaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddr)}`;
  const moreEvents = v.url || "";

  venueCard.innerHTML = `
    <div class="venue">
      <div class="name">${escapeHtml(fullName)}</div>
      <div class="vwrap">
        <div class="left">
          <div class="addr">${escapeHtml(v.address || "N/A")}<br>${escapeHtml(cityState)}<br>${escapeHtml(v.postalCode || "N/A")}</div>
          <div class="links">
            <a href="${gmaps}" target="_blank" rel="noopener">Open in Google Maps</a>
            ${moreEvents ? `&nbsp; | &nbsp;<a href="${escapeHtml(moreEvents)}" target="_blank" rel="noopener">More events at this venue</a>` : ""}
          </div>
        </div>
        <div class="logo">
          ${v.image ? `<img src="${escapeHtml(v.image)}" alt="${escapeHtml(fullName)}">` : ""}
        </div>
      </div>
    </div>
  `;
  venueCard.classList.remove("hidden");
}

/* ---------------- form wiring ---------------- */
distanceInput.value = "10";
distanceInput.classList.add("as-placeholder");
distanceInput.addEventListener("input", ()=>distanceInput.classList.remove("as-placeholder"));

autoDetect.addEventListener("change", async ()=>{
  if(autoDetect.checked){
    setAutoDetectMode();
    autoStatus.textContent = "Detecting location…";
    try{
      const info = await getIpLocation();
      latHidden.value = String(info.lat); lonHidden.value = String(info.lon);
      autoStatus.textContent = `Detected: ${info.city??""} ${info.region??""}`.trim();
    }catch{
      autoStatus.textContent = "Could not detect location. Please enter it manually.";
      autoDetect.checked = false; setManualLocationMode();
    }
  }else setManualLocationMode();
});

form.addEventListener("submit", async e=>{
  e.preventDefault();
  autoDetect.checked ? setAutoDetectMode() : setManualLocationMode();
  if(!form.checkValidity()){ form.reportValidity(); return; }

  let lat, lon;
  try{
    if(autoDetect.checked){
      if(!latHidden.value || !lonHidden.value){ const info = await getIpLocation(); lat=info.lat; lon=info.lon; }
      else { lat = Number(latHidden.value); lon = Number(lonHidden.value); }
    }else{
      const coords = await geocodeAddress(locationInput.value.trim());
      lat = coords.lat; lon = coords.lon; latHidden.value=String(lat); lonHidden.value=String(lon);
    }
  }catch{ showError("Unable to resolve your location. Please try again."); return; }

  const params = new URLSearchParams({
    keyword:  keywordInput.value.trim(),
    distance: (distanceInput.value || "10").trim(),
    category: (categorySel.value || "default").trim(),
    lat: String(lat), lon: String(lon)
  });

  showLoading();
  try{
    const resp = await fetch(`/search?${params.toString()}`, {method:"GET"});
    let payload = {}; try{ payload = await resp.json(); }catch{}
    if(!resp.ok){ showError(payload.error || payload.details || `HTTP ${resp.status}`); return; }

    currentItems = Array.isArray(payload.events) ? payload.events.slice(0,20) : [];
    if(currentItems.length===0){ showEmpty(); return; }

    sortState = {key:null, dir:"asc"};
    renderTable();
  }catch(err){ console.error(err); showError("Network error. Please try again."); }
});

clearButton.addEventListener("click", ()=>{
  form.reset();
  setManualLocationMode();
  latHidden.value=""; lonHidden.value="";
  resultsSection.classList.add("hidden");
  errorEl.classList.add("hidden"); emptyEl.classList.add("hidden");
  resultsTableWrap.classList.add("hidden"); loadingEl.classList.add("hidden");
  detailsCard.classList.add("hidden"); venueCard.classList.add("hidden");
  distanceInput.value="10"; distanceInput.classList.add("as-placeholder");
  currentItems=[]; sortState={key:null, dir:"asc"};
});

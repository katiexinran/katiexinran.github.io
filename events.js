// === CONFIG (for homework demo only) ===
const IPINFO_TOKEN = "3d5aa08629e9e7";

// === DOM refs ===
const form        = document.getElementById("searchForm");
const keywordEl   = document.getElementById("keyword");
const distanceEl  = document.getElementById("distance");
const categoryEl  = document.getElementById("category");
const locationEl  = document.getElementById("location");
const autoDetect  = document.getElementById("autoDetect");
const autoStatus  = document.getElementById("autoStatus");
const clearButton = document.getElementById("clearButton");
const latEl       = document.getElementById("lat");
const lonEl       = document.getElementById("lon");

// === helpers ===
async function getIpLocation() {
  const url = `https://ipinfo.io/json?token=${IPINFO_TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`IPInfo HTTP ${res.status}`);
  const data = await res.json();
  if (!data.loc) throw new Error("No 'loc' in IPInfo response");
  const [lat, lon] = data.loc.split(",").map(Number);
  return { lat, lon, city: data.city, region: data.region, country: data.country };
}

// === auto-detect toggle ===
autoDetect.addEventListener("change", async () => {
  if (autoDetect.checked) {
    // switch to auto mode: hide manual location
    locationEl.style.display = "none";
    locationEl.value = "";
    locationEl.removeAttribute("required");

    autoStatus.textContent = "Detecting location…";
    latEl.value = "";
    lonEl.value = "";

    try {
      const info = await getIpLocation();
      latEl.value = String(info.lat);
      lonEl.value = String(info.lon);
      autoStatus.textContent = `Detected: ${info.city || ""} ${info.region || ""}`.trim();
      console.log("IPInfo:", info);
    } catch (err) {
      console.error("IPInfo error:", err);
      autoStatus.textContent = "Could not detect location. Please enter it manually.";
      // fall back to manual entry
      autoDetect.checked = false;
      locationEl.style.display = "block";
      locationEl.setAttribute("required", "required");
    }
  } else {
    // back to manual mode
    autoStatus.textContent = "";
    latEl.value = "";
    lonEl.value = "";
    locationEl.style.display = "block";
    locationEl.setAttribute("required", "required");
  }
});

// === submit (no backend call yet; just validate + log) ===
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const keyword = keywordEl.value.trim();
  const distance = distanceEl.value || "10";
  const category = categoryEl.value;

  const useAutoDetect = autoDetect.checked;
  const locationVal = useAutoDetect ? null : (locationEl.value.trim() || null);
  const lat = latEl.value ? Number(latEl.value) : null;
  const lon = lonEl.value ? Number(lonEl.value) : null;

  if (!keyword) {
    alert("Keyword is required.");
    return;
  }
  if (!useAutoDetect && !locationVal) {
    alert("Please enter a location or check Auto-Detect.");
    locationEl.focus();
    return;
  }
  if (useAutoDetect && (lat === null || lon === null)) {
    alert("Could not detect your location. Please enter it manually.");
    return;
  }

  console.log("SEARCH clicked with:", {
    keyword, distance, category, useAutoDetect, location: locationVal, lat, lon
  });

  // NEXT: send these to Flask via fetch('/search?...')
});

// === clear ===
clearButton.addEventListener("click", () => {
  form.reset();
  autoStatus.textContent = "";
  latEl.value = "";
  lonEl.value = "";
  locationEl.style.display = "block";
  locationEl.setAttribute("required", "required");
  console.log("Form cleared");
});

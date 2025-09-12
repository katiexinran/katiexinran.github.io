// ----- config -----
const IPINFO_TOKEN = "3d5aa08629e9e7";

const GOOGLE_GEOCODE_KEY = "YOUR_GOOGLE_KEY_HERE";

// ----- elements -----
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

// ----- helpers -----
async function getIpLocation() {
  const res = await fetch(`https://ipinfo.io/json?token=${IPINFO_TOKEN}`);
  if (!res.ok) throw new Error(`IPInfo HTTP ${res.status}`);
  const data = await res.json();
  if (!data.loc) throw new Error("No 'loc' in IPInfo response");
  const [lat, lon] = data.loc.split(",").map(Number);
  return { lat, lon, city: data.city, region: data.region, country: data.country };
}

function setManualLocationMode() {
  // show text box and make it required
  locationInput.style.display = "block";
  locationInput.required = true;

  // clear auto-detected coords + message
  latHidden.value = "";
  lonHidden.value = "";
  autoStatus.textContent = "";
}

function setAutoDetectMode() {
  // hide text box and remove 'required' so HTML5 validation doesn’t block
  locationInput.style.display = "none";
  locationInput.required = false;
}

// ----- checkbox toggle -----
autoDetect.addEventListener("change", async () => {
  if (autoDetect.checked) {
    setAutoDetectMode();
    autoStatus.textContent = "Detecting location...";

    try {
      const info = await getIpLocation();
      latHidden.value = String(info.lat);
      lonHidden.value = String(info.lon);
      autoStatus.textContent = `Detected: ${info.city ?? ""} ${info.region ?? ""}`.trim();
    } catch (err) {
      // fall back to manual entry
      autoStatus.textContent = "Could not detect location. Please enter it manually.";
      autoDetect.checked = false;
      setManualLocationMode();
    }
  } else {
    setManualLocationMode();
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // keep required-ness in sync with the checkbox
  if (autoDetect.checked) {
    setAutoDetectMode();
  } else {
    setManualLocationMode();
  }

  // show native “Please fill out this field.” tooltip if something is missing
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  // We have valid inputs. Resolve coordinates.
  let lat, lng;

  if (autoDetect.checked) {
    // use IPInfo (and cache into hidden fields)
    if (!latHidden.value || !lonHidden.value) {
      try {
        const info = await getIpLocation();
        lat = info.lat; lng = info.lon;
        latHidden.value = String(lat);
        lonHidden.value = String(lng);
      } catch (err) {
        autoStatus.textContent = "Could not detect location. Please enter it manually.";
        autoDetect.checked = false;
        setManualLocationMode();
        return;
      }
    } else {
      lat = Number(latHidden.value);
      lng = Number(lonHidden.value);
    }
  } else {
    // manual address → geocode via Google
    const address = locationInput.value.trim();
    try {
      const coords = await geocodeAddress(address);
      lat = coords.lat; lng = coords.lng;
      latHidden.value = String(lat);
      lonHidden.value = String(lng);
    } catch (err) {
      autoStatus.textContent = "Could not geocode that address. Please refine it.";
      console.error(err);
      return;
    }
  }

  // build payload (for now we just log; later you’ll send to Flask)
  const payload = {
    keyword:  keywordInput.value.trim(),
    distance: distanceInput.value || "10",
    category: categorySel.value,
    useAuto:  autoDetect.checked,
    location: autoDetect.checked ? null : locationInput.value.trim(),
    lat, lng
  };

  console.log("SEARCH payload (ready for Ticketmaster step):", payload);
});

// ----- clear -----
clearButton.addEventListener("click", () => {
  form.reset();
  setManualLocationMode();   // show location box again after reset
});


async function geocodeAddress(address) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_GEOCODE_KEY}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);

  const data = await res.json();
  if (data.status !== "OK" || !data.results.length) {
    throw new Error(`Geocode failed: ${data.status}`);
  }

  // pick the first result
  const loc = data.results[0].geometry.location;
  return { lat: loc.lat, lng: loc.lng };
}

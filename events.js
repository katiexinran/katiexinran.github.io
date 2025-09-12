// ----- config -----
const IPINFO_TOKEN = "3d5aa08629e9e7";

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

// ----- submit (use native validation tooltips) -----
form.addEventListener("submit", (e) => {
  // keep location requirement in sync before checking validity
  if (autoDetect.checked) setAutoDetectMode(); else setManualLocationMode();

  if (!form.checkValidity()) {
    e.preventDefault();          // stop submit
    form.reportValidity();       // show the orange tooltip near the first invalid field
    return;
  }

  e.preventDefault();            // remove this if/when you actually submit to server
  // gather values (for now just log)
  const payload = {
    keyword:  keywordInput.value.trim(),
    distance: distanceInput.value || "10",
    category: categorySel.value,
    useAuto:  autoDetect.checked,
    location: autoDetect.checked ? null : locationInput.value.trim(),
    lat:      latHidden.value || null,
    lon:      lonHidden.value || null,
  };
  console.log("SEARCH payload", payload);
});

// ----- clear -----
clearButton.addEventListener("click", () => {
  form.reset();
  setManualLocationMode();   // show location box again after reset
});

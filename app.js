/**
 * SolarFlare - Core Application Logic
 * Completely offline pseudo-random simulation of space weather.
 * Includes localized impact calculation based on city selection and suncalc.
 */

// Simple seeded random function
function seededRandom(seed) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

let activeCity = null;

// Generate the simulation based on a date seed and optional location
function generateSpaceWeather(city) {
  const now = new Date();
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  
  // 1. Flare X-Ray Flux (Global)
  const flareRand = seededRandom(seed * 1.1);
  let flareClass, flareDesc, flareSeverity;
  
  if (flareRand > 0.95) {
    flareClass = 'X' + (seededRandom(seed) * 5).toFixed(1);
    flareDesc = 'Major Flare Activity';
    flareSeverity = 'severity-high';
  } else if (flareRand > 0.7) {
    flareClass = 'M' + (seededRandom(seed) * 9).toFixed(1);
    flareDesc = 'Moderate Activity';
    flareSeverity = 'severity-med';
  } else if (flareRand > 0.3) {
    flareClass = 'C' + (seededRandom(seed) * 9).toFixed(1);
    flareDesc = 'Minor Activity';
    flareSeverity = 'severity-low';
  } else {
    flareClass = 'B' + (seededRandom(seed) * 9).toFixed(1);
    flareDesc = 'Quiet';
    flareSeverity = 'severity-low';
  }

  // 2. Geomagnetic Storm (Kp Index) (Global)
  const kpRand = seededRandom(seed * 1.2);
  let kpIndex, kpDesc, kpSeverity;

  if (kpRand > 0.9) {
    kpIndex = Math.floor(kpRand * 4) + 6; // Kp 6-9
    kpDesc = 'Strong Storm (G3-G5)';
    kpSeverity = 'severity-high';
  } else if (kpRand > 0.6) {
    kpIndex = 5;
    kpDesc = 'Minor Storm (G1)';
    kpSeverity = 'severity-med';
  } else {
    kpIndex = Math.floor(kpRand * 4) + 1; // Kp 1-4
    kpDesc = 'Quiet/Normal';
    kpSeverity = 'severity-low';
  }

  // Localized Impacts
  let auroraVal = 'Low';
  let auroraDesc = 'Only at extreme poles';
  let auroraSeverity = 'severity-low';

  if (city) {
    // 3. Aurora Likelihood (Latitude dependent)
    const lat = Math.abs(city.lat);
    let minLatForAurora = 90;
    
    if (kpIndex >= 8) minLatForAurora = 40;
    else if (kpIndex >= 6) minLatForAurora = 50;
    else if (kpIndex === 5) minLatForAurora = 60;
    else minLatForAurora = 65;

    if (lat >= minLatForAurora) {
      auroraVal = 'Visible!';
      auroraDesc = 'Overhead or on northern horizon';
      auroraSeverity = 'severity-high';
    } else if (lat >= minLatForAurora - 5) {
      auroraVal = 'Possible';
      auroraDesc = 'Look low on horizon';
      auroraSeverity = 'severity-med';
    } else {
      auroraVal = 'Unlikely';
      auroraDesc = `Latitude ${Math.round(lat)}° too low for Kp ${kpIndex}`;
      auroraSeverity = 'severity-low';
    }

    // Adjust Flare Description based on Day/Night (Radio Blackouts)
    if (typeof SunCalc !== 'undefined') {
      const sunPos = SunCalc.getPosition(now, city.lat, city.lon);
      const isDay = sunPos.altitude > 0;
      
      if (!isDay && (flareClass.startsWith('M') || flareClass.startsWith('X'))) {
        flareDesc = 'Nighttime — No local radio blackout';
        flareSeverity = 'severity-low'; // Override severity for local impact
      } else if (isDay && flareClass.startsWith('X')) {
        flareDesc = 'Major dayside radio blackout (R3-R5)';
      } else if (isDay && flareClass.startsWith('M')) {
        flareDesc = 'Minor dayside radio blackout (R1-R2)';
      }
    }
  } else {
    // Generic fallback if no city selected
    if (kpIndex >= 6) {
      auroraVal = 'High';
      auroraDesc = 'Visible at mid-latitudes';
      auroraSeverity = 'severity-high';
    } else if (kpIndex === 5) {
      auroraVal = 'Moderate';
      auroraDesc = 'Visible at high-latitudes';
      auroraSeverity = 'severity-med';
    }
  }

  // Update UI
  document.getElementById('current-date').textContent = now.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + (city ? ` in ${city.name}` : '');
  
  const statusEl = document.getElementById('overall-status');
  if (kpIndex >= 6 || flareClass.startsWith('X')) {
    statusEl.textContent = 'Storm Active';
    statusEl.style.color = 'var(--accent-rose)';
  } else if (kpIndex === 5 || flareClass.startsWith('M')) {
    statusEl.textContent = 'Elevated';
    statusEl.style.color = 'var(--accent-orange)';
  } else {
    statusEl.textContent = 'Quiet';
    statusEl.style.color = 'var(--accent-green)';
  }

  // Apply to cards
  updateCard('card-xray', 'res-xray', 'res-xray-desc', flareClass, flareDesc, flareSeverity);
  updateCard('card-kp', 'res-kp', 'res-kp-desc', 'Kp ' + kpIndex, kpDesc, kpSeverity);
  updateCard('card-aurora', 'res-aurora', 'res-aurora-desc', auroraVal, auroraDesc, auroraSeverity);
  
  document.getElementById('results-card').hidden = false;
}

function updateCard(cardId, valId, descId, val, desc, severityClass) {
  const card = document.getElementById(cardId);
  document.getElementById(valId).textContent = val;
  document.getElementById(descId).textContent = desc;
  
  card.className = 'sun-time-card ' + severityClass;
}


// --- CITY SEARCH LOGIC ---
const searchInput = document.getElementById('city-search');
const dropdown = document.getElementById('city-dropdown');
const citySelected = document.getElementById('city-selected');
const citySelectedText = document.getElementById('city-selected-text');
const cityClearBtn = document.getElementById('city-clear-btn');

function normalizeStr(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

searchInput.addEventListener('input', (e) => {
  const query = normalizeStr(e.target.value.trim());
  dropdown.innerHTML = '';
  
  if (query.length < 2) {
    dropdown.hidden = true;
    return;
  }
  
  // Basic substring match
  const matches = CITIES.filter(c => 
    normalizeStr(c.name).includes(query) || 
    normalizeStr(c.country).includes(query)
  ).slice(0, 10);
  
  if (matches.length > 0) {
    dropdown.hidden = false;
    matches.forEach(city => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="city-name">${city.name}</span><span class="city-country">${city.country}</span>`;
      li.addEventListener('click', () => {
        selectCity(city);
      });
      dropdown.appendChild(li);
    });
  } else {
    dropdown.hidden = true;
  }
});

function selectCity(city) {
  activeCity = city;
  searchInput.value = '';
  dropdown.hidden = true;
  searchInput.parentElement.hidden = true;
  citySelected.hidden = false;
  citySelectedText.textContent = `${city.name}, ${city.country}`;
  
  generateSpaceWeather(city);
}

cityClearBtn.addEventListener('click', () => {
  activeCity = null;
  citySelected.hidden = true;
  searchInput.parentElement.hidden = false;
  document.getElementById('results-card').hidden = true;
  searchInput.focus();
});

// Close dropdown on outside click
document.addEventListener('click', (e) => {
  if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.hidden = true;
  }
});

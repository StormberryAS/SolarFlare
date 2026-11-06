/*! SolarFlare: app.js is compiled from ts/app.ts by tools/build-ts.sh, which leaves out every
    comment but this one: the explanations are in the source. Edit the .ts, never the .js: the build
    refuses to overwrite a hand edit, and its check mode fails on one. */

/**
 * SolarFlare: core application logic.
 * A pseudo-random simulation of space weather that runs entirely in the browser (it fetches no
 * data), with a local impact for the chosen city (its latitude, and day or night there from
 * SunCalc).
 *
 * A classic script, not a module: index.html loads suncalc.js (the vendored SunCalc 1.8.0, which
 * publishes the global SunCalc, typed in ts/suncalc.d.ts) and cities.js (the shared Labs city
 * catalogue, which publishes the globals CITIES and foldQuery, typed in ts/cities.d.ts) in the
 * head, and app.js at the end of the body; all of them share one global scope. This file has no
 * import or export, so tsc compiles it to a plain script at the same path (app.js). It keeps
 * nothing in localStorage.
 */

/** The element with this id, of this kind; the page always has it, so a miss is a broken page. */
function byId<T extends HTMLElement>(id: string, kind: { new (): T; prototype: T }): T {
  const el = document.getElementById(id);
  if (!(el instanceof kind)) throw new Error(`SolarFlare: #${id} is missing from the page`);
  return el;
}

// Simple seeded random function
function seededRandom(seed: number): number {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

let activeCity: City | null = null;

// Generate the simulation based on a date seed and optional location
function generateSpaceWeather(city: City | null): void {
  const now = new Date();
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();

  // 1. Flare X-Ray Flux (Global)
  const flareRand = seededRandom(seed * 1.1);
  let flareClass: string, flareDesc: string, flareSeverity: string;

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
  let kpIndex: number, kpDesc: string, kpSeverity: string;

  if (kpRand > 0.9) {
    kpIndex = Math.floor(kpRand * 4) + 6; // Kp 6 to 9
    kpDesc = 'Strong Storm (G3-G5)';
    kpSeverity = 'severity-high';
  } else if (kpRand > 0.6) {
    kpIndex = 5;
    kpDesc = 'Minor Storm (G1)';
    kpSeverity = 'severity-med';
  } else {
    kpIndex = Math.floor(kpRand * 4) + 1; // Kp 1 to 4
    kpDesc = 'Quiet/Normal';
    kpSeverity = 'severity-low';
  }

  // Localised impacts
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
        // The text on the card, unchanged: "Nighttime", an em dash (written as its escape), then
        // "No local radio blackout".
        flareDesc = 'Nighttime \u2014 No local radio blackout';
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
  byId('current-date', HTMLElement).textContent = now.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + (city ? ` in ${city.name}` : '');

  // The colours are CSS custom properties of style.css, set as text.
  const statusEl = byId('overall-status', HTMLElement);
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

  byId('results-card', HTMLElement).hidden = false;
}

function updateCard(cardId: string, valId: string, descId: string, val: string, desc: string, severityClass: string): void {
  const card = byId(cardId, HTMLElement);
  byId(valId, HTMLElement).textContent = val;
  byId(descId, HTMLElement).textContent = desc;

  card.className = 'sun-time-card ' + severityClass;
}


// The city search
const searchInput = byId('city-search', HTMLInputElement);
const dropdown = byId('city-dropdown', HTMLElement);
const citySelected = byId('city-selected', HTMLElement);
const citySelectedText = byId('city-selected-text', HTMLElement);
const cityClearBtn = byId('city-clear-btn', HTMLElement);

/** The search wrapper around the field, which the page hides while a city is chosen. */
function searchBox(): HTMLElement {
  const box = searchInput.parentElement;
  if (!box) throw new Error('SolarFlare: #city-search has no wrapper');
  return box;
}

// Delegates to foldQuery in the shared cities.js. The previous local version
// was NFD-only, which cannot split atomic letters like 'o-slash', so "tromso"
// never matched "Tromso-with-slash". Keeping one implementation means that
// class of bug is fixed everywhere at once.
function normalizeStr(s: string): string {
  return foldQuery(s);
}

// The target of an input event on this field is always the field itself, so its value is read
// from searchInput.
searchInput.addEventListener('input', () => {
  const query = normalizeStr(searchInput.value.trim());
  dropdown.innerHTML = '';

  if (query.length < 2) {
    dropdown.hidden = true;
    return;
  }

  // Basic substring match
  // Prefix matches first. With 25,000 cities a bare substring filter
  // buries the obvious answer: "erdal" returned Cloverdale, South
  // Riverdale and Terdal ahead of Erdal, and with only 10 rows shown the
  // city being typed could fall off the list entirely.
  const startsWith: City[] = [], contains: City[] = [];
  for (const c of CITIES) {
    // c.alt is the folded English exonym where GeoNames stores the local
    // name, so "gothenburg" finds Goteborg and "cologne" finds Koeln.
    if (c.fold.startsWith(query) || c.alt.startsWith(query)) startsWith.push(c);
    else if (c.fold.includes(query) || c.alt.includes(query) || c.cfold.includes(query)) contains.push(c);
  }
  const matches = startsWith.concat(contains).slice(0, 10);

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

function selectCity(city: City): void {
  activeCity = city;
  searchInput.value = '';
  dropdown.hidden = true;
  searchBox().hidden = true;
  citySelected.hidden = false;
  citySelectedText.textContent = `${city.name}, ${city.country}`;

  generateSpaceWeather(city);
}

cityClearBtn.addEventListener('click', () => {
  activeCity = null;
  citySelected.hidden = true;
  searchBox().hidden = false;
  byId('results-card', HTMLElement).hidden = true;
  searchInput.focus();
});

// Close the dropdown on a click outside it. A click's target is always a node of the page.
document.addEventListener('click', (e) => {
  const target = e.target instanceof Node ? e.target : null;
  if (!searchInput.contains(target) && !dropdown.contains(target)) {
    dropdown.hidden = true;
  }
});

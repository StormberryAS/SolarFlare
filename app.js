"use strict";
/*! SolarFlare: app.js is compiled from ts/app.ts by tools/build-ts.sh, which leaves out every
    comment but this one: the explanations are in the source. Edit the .ts, never the .js: the build
    refuses to overwrite a hand edit, and its check mode fails on one. */
function byId(id, kind) {
    const el = document.getElementById(id);
    if (!(el instanceof kind))
        throw new Error(`SolarFlare: #${id} is missing from the page`);
    return el;
}
function seededRandom(seed) {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}
let activeCity = null;
function generateSpaceWeather(city) {
    const now = new Date();
    const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    const flareRand = seededRandom(seed * 1.1);
    let flareClass, flareDesc, flareSeverity;
    if (flareRand > 0.95) {
        flareClass = 'X' + (seededRandom(seed) * 5).toFixed(1);
        flareDesc = 'Major Flare Activity';
        flareSeverity = 'severity-high';
    }
    else if (flareRand > 0.7) {
        flareClass = 'M' + (seededRandom(seed) * 9).toFixed(1);
        flareDesc = 'Moderate Activity';
        flareSeverity = 'severity-med';
    }
    else if (flareRand > 0.3) {
        flareClass = 'C' + (seededRandom(seed) * 9).toFixed(1);
        flareDesc = 'Minor Activity';
        flareSeverity = 'severity-low';
    }
    else {
        flareClass = 'B' + (seededRandom(seed) * 9).toFixed(1);
        flareDesc = 'Quiet';
        flareSeverity = 'severity-low';
    }
    const kpRand = seededRandom(seed * 1.2);
    let kpIndex, kpDesc, kpSeverity;
    if (kpRand > 0.9) {
        kpIndex = Math.floor(kpRand * 4) + 6;
        kpDesc = 'Strong Storm (G3-G5)';
        kpSeverity = 'severity-high';
    }
    else if (kpRand > 0.6) {
        kpIndex = 5;
        kpDesc = 'Minor Storm (G1)';
        kpSeverity = 'severity-med';
    }
    else {
        kpIndex = Math.floor(kpRand * 4) + 1;
        kpDesc = 'Quiet/Normal';
        kpSeverity = 'severity-low';
    }
    let auroraVal = 'Low';
    let auroraDesc = 'Only at extreme poles';
    let auroraSeverity = 'severity-low';
    if (city) {
        const lat = Math.abs(city.lat);
        let minLatForAurora = 90;
        if (kpIndex >= 8)
            minLatForAurora = 40;
        else if (kpIndex >= 6)
            minLatForAurora = 50;
        else if (kpIndex === 5)
            minLatForAurora = 60;
        else
            minLatForAurora = 65;
        if (lat >= minLatForAurora) {
            auroraVal = 'Visible!';
            auroraDesc = 'Overhead or on northern horizon';
            auroraSeverity = 'severity-high';
        }
        else if (lat >= minLatForAurora - 5) {
            auroraVal = 'Possible';
            auroraDesc = 'Look low on horizon';
            auroraSeverity = 'severity-med';
        }
        else {
            auroraVal = 'Unlikely';
            auroraDesc = `Latitude ${Math.round(lat)}° too low for Kp ${kpIndex}`;
            auroraSeverity = 'severity-low';
        }
        if (typeof SunCalc !== 'undefined') {
            const sunPos = SunCalc.getPosition(now, city.lat, city.lon);
            const isDay = sunPos.altitude > 0;
            if (!isDay && (flareClass.startsWith('M') || flareClass.startsWith('X'))) {
                flareDesc = 'Nighttime \u2014 No local radio blackout';
                flareSeverity = 'severity-low';
            }
            else if (isDay && flareClass.startsWith('X')) {
                flareDesc = 'Major dayside radio blackout (R3-R5)';
            }
            else if (isDay && flareClass.startsWith('M')) {
                flareDesc = 'Minor dayside radio blackout (R1-R2)';
            }
        }
    }
    else {
        if (kpIndex >= 6) {
            auroraVal = 'High';
            auroraDesc = 'Visible at mid-latitudes';
            auroraSeverity = 'severity-high';
        }
        else if (kpIndex === 5) {
            auroraVal = 'Moderate';
            auroraDesc = 'Visible at high-latitudes';
            auroraSeverity = 'severity-med';
        }
    }
    byId('current-date', HTMLElement).textContent = now.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + (city ? ` in ${city.name}` : '');
    const statusEl = byId('overall-status', HTMLElement);
    if (kpIndex >= 6 || flareClass.startsWith('X')) {
        statusEl.textContent = 'Storm Active';
        statusEl.style.color = 'var(--accent-rose)';
    }
    else if (kpIndex === 5 || flareClass.startsWith('M')) {
        statusEl.textContent = 'Elevated';
        statusEl.style.color = 'var(--accent-orange)';
    }
    else {
        statusEl.textContent = 'Quiet';
        statusEl.style.color = 'var(--accent-green)';
    }
    updateCard('card-xray', 'res-xray', 'res-xray-desc', flareClass, flareDesc, flareSeverity);
    updateCard('card-kp', 'res-kp', 'res-kp-desc', 'Kp ' + kpIndex, kpDesc, kpSeverity);
    updateCard('card-aurora', 'res-aurora', 'res-aurora-desc', auroraVal, auroraDesc, auroraSeverity);
    byId('results-card', HTMLElement).hidden = false;
}
function updateCard(cardId, valId, descId, val, desc, severityClass) {
    const card = byId(cardId, HTMLElement);
    byId(valId, HTMLElement).textContent = val;
    byId(descId, HTMLElement).textContent = desc;
    card.className = 'sun-time-card ' + severityClass;
}
const searchInput = byId('city-search', HTMLInputElement);
const dropdown = byId('city-dropdown', HTMLElement);
const citySelected = byId('city-selected', HTMLElement);
const citySelectedText = byId('city-selected-text', HTMLElement);
const cityClearBtn = byId('city-clear-btn', HTMLElement);
function searchBox() {
    const box = searchInput.parentElement;
    if (!box)
        throw new Error('SolarFlare: #city-search has no wrapper');
    return box;
}
function normalizeStr(s) {
    return foldQuery(s);
}
searchInput.addEventListener('input', () => {
    const query = normalizeStr(searchInput.value.trim());
    dropdown.innerHTML = '';
    if (query.length < 2) {
        dropdown.hidden = true;
        return;
    }
    const startsWith = [], contains = [];
    for (const c of CITIES) {
        if (c.fold.startsWith(query) || c.alt.startsWith(query))
            startsWith.push(c);
        else if (c.fold.includes(query) || c.alt.includes(query) || c.cfold.includes(query))
            contains.push(c);
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
    }
    else {
        dropdown.hidden = true;
    }
});
function selectCity(city) {
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
document.addEventListener('click', (e) => {
    const target = e.target instanceof Node ? e.target : null;
    if (!searchInput.contains(target) && !dropdown.contains(target)) {
        dropdown.hidden = true;
    }
});

# SolarFlare

Privacy-first space-weather dashboard. SolarFlare simulates real-time solar-flare activity, geomagnetic storm (Kp index) monitoring, and aurora forecasts, using offline pseudo-random algorithms and local daylight detection.

**Live:** [flare.stormberry.as](https://flare.stormberry.as)

## Features
- **Space-weather simulation**: consistent daily forecast using seeded pseudo-random orbital mechanics algorithms.
- **City search**: rapid, offline autocomplete for 2,000+ major cities to provide localised impact analysis.
- **Aurora visibility**: localised aurora forecast dynamically calculated based on city latitude and current Kp index.
- **Radio blackout warnings**: localised dayside calculations to determine if radio frequency blackouts affect your region.
- **Responsive layout**: optimised for mobile and desktop with a cinematic "hot plasma" glassmorphism theme.

## Architecture
- **Vanilla HTML and CSS, TypeScript**, no frameworks.
- **TypeScript source in `ts/`, compiled JavaScript committed.** `ts/app.ts` compiles to `app.js`, at the same path the page has always loaded, as a classic script (no modules). The compiled file is committed because GitHub Pages serves the repository as it is, with no build step of its own; `.gitattributes` marks it as generated. Edit the TypeScript, never the `.js`.
- **Vendored and generated files kept as they are.** `suncalc.js` is SunCalc 1.8.0, vendored unchanged; `ts/suncalc.d.ts` types it. `cities.js` is the shared Stormberry Labs city catalogue, written by SunApp's `update_cities.py`; `ts/cities.d.ts` types it. `gate.js` and `gate.css`, the first-run notice, are written by the shared `build-gates.py`. None of them is edited here.
- **Build:** `npm run build` (`tools/build-ts.sh`) installs the pinned compiler (`npm ci`), compiles, then runs `bump_assets.py` to restamp the `?v=` cache stamps. `npm run check` changes nothing and fails when the committed JavaScript is not what the TypeScript compiles to. `npm test` runs the tests in `tests/` with the test runner built into Node 24. The published app has no runtime dependencies.
- **Privacy first**, no cookies, no tracking. Zero external API calls. The entire simulation runs offline within the browser.
- Stormberry dark-mode glassmorphism design system, Inter typography.
- **Sovereign AI**, built and maintained using high-speed agentic workflows.

## Stack
- Browser `Date` and `Math.sin` for deterministic pseudo-random seed generation.
- [SunCalc](https://github.com/mourner/suncalc) for localised day/night solar position calculations, bundled locally.
- Bundled city database extracted from the Stormberry ecosystem.
- [Inter](https://rsms.me/inter/) typeface, locally hosted.

## Local development
```bash
git clone https://github.com/StormberryAS/SolarFlare.git
cd SolarFlare
python3 -m http.server 3002
```
Open `http://localhost:3002` in your browser.

## Credits
Built by [Stormberry AS](https://stormberry.as). Proudly powered by sovereign AI agents.

## Disclaimer

Supplied free of charge, **as is**, with no warranty of any kind. Using it creates no client or advisory relationship with Stormberry AS, and nothing it produces is professional advice.

**The space-weather figures in SolarFlare are simulated, not observed.** They are produced by a seeded deterministic algorithm so that the display is stable and repeatable offline. They are not measurements, not a forecast, and bear no relation to actual solar or geomagnetic activity. For real space weather use [NOAA SWPC](https://www.swpc.noaa.gov/).

This is a **functioning prototype**, not a certified instrument and not a professional service. **Its readings are simulated and are not real data.** Do not use it as a source for any decision at all. Stormberry AS reimburses no cost or loss arising from use of this application.

Full terms: [DISCLAIMER.md](DISCLAIMER.md).

# SolarFlare

Privacy-first space-weather dashboard. SolarFlare simulates real-time solar-flare activity, geomagnetic storm (Kp index) monitoring, and aurora forecasts, utilizing offline pseudo-random algorithms and local daylight detection.

**Live:** [flare.stormberry.as](https://flare.stormberry.as)

## Features
- **Space-weather simulation**: consistent daily forecast using seeded pseudo-random orbital mechanics algorithms.
- **City search**: rapid, offline autocomplete for 2,000+ major cities to provide localized impact analysis.
- **Aurora visibility**: localized aurora forecast dynamically calculated based on city latitude and current Kp index.
- **Radio blackout warnings**: localized dayside calculations to determine if radio frequency blackouts affect your region.
- **Responsive layout**: optimised for mobile and desktop with a cinematic "hot plasma" glassmorphism theme.

## Architecture
- **Vanilla HTML/CSS/JS**, no frameworks, no build step.
- **Privacy first**, no cookies, no tracking. Zero external API calls. The entire simulation runs offline within the browser.
- Stormberry dark-mode glassmorphism design system, Inter typography.
- **Sovereign AI**, built and maintained using high-speed agentic workflows.

## Stack
- Browser `Date` and `Math.sin` for deterministic pseudo-random seed generation.
- [SunCalc](https://github.com/mourner/suncalc) for localized day/night solar position calculations, bundled locally.
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

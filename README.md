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

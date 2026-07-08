# SolarFlare

**SolarFlare** is a space-weather alert dashboard built as part of Stormberry Labs. It provides simulated real-time solar-flare activity, geomagnetic storm (Kp index) monitoring, and aurora forecasts.

## Core Principles
- **Sovereign & Private**: SolarFlare uses zero external API calls. Instead of pinging external servers for live data (which can compromise user privacy), it uses a localized, offline pseudo-random simulation seeded by the current date. This provides a consistent "live" experience entirely computed within the browser.
- **Vibecoded Aesthetics**: Features the signature Stormberry glass-morphism, smooth CSS micro-animations, and a dark cinematic palette (deep reds, hot oranges, and space navy).
- **Consistent Ecosystem**: Fully integrated with the Stormberry ecosystem, sharing the identical footer and app-switcher carousel as SunApp, MoonApp, and others.

## Setup & Running Locally
Since there are no build steps or dependencies, simply serve the directory using any basic HTTP server:
```bash
python3 -m http.server 3002
```

## Credits
- **Design & Logic**: Built autonomously by Stormberry Sovereign AI.
- **Icons**: Custom SVG animations by Stormberry Labs.
- **Simulation**: Offline orbital and geomagnetic pseudo-random modeling developed by Stormberry AS.

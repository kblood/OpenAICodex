# OpenAICodex

Storage for Codex

## Offline OpenStreetMap Project
This repository hosts planning documents for an offline, installable browser-based OpenStreetMap application served from a single server. See the [docs](docs/) directory for:
- [Project Plan Overview](docs/plan_overview.md)
- [Detailed Specification](docs/spec_sheet.md)

### Running the prototype
1. Install dependencies: `npm install`
2. Start the server: `npm start`
3. Visit `http://localhost:3000` in your browser.

The prototype lets you search the Geofabrik dataset index, download `.pbf` extracts, and process them with [tilemaker](https://github.com/systemed/tilemaker) to produce vector tiles served to a [MapLibre](https://maplibre.org/) map. It also registers a service worker and manifest for installable offline use.

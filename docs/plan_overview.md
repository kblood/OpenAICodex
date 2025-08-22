# Offline OpenStreetMap Project Plan Overview

## Goal
Create an offline-capable mapping application that allows users to search, download, and use OpenStreetMap (OSM) data without internet access. The system should provide map tiles and route finding based on locally stored data.

## Core Features
- **Geofabrik Search and Download**: UI to search for regional extracts from [Geofabrik](https://download.geofabrik.de) and generate direct download links for `.pbf` files.
- **Local Map Processing**: Convert downloaded `.pbf` files into vector tiles using [Tilemaker](https://github.com/systemed/tilemaker).
- **Map Rendering Backend**: Serve and display offline tiles using MapLibre.
- **Route Finding**: Provide offline routing capabilities based on the imported map data.
- **Installable Browser App**: Ship as a Progressive Web App that runs entirely in the browser and can be installed for offline use.
- **Single Integrated Server**: One server process handles tile serving, routing, and data storage without relying on external databases or additional ports.
- **Offline Address Search**: Store address indexes locally to enable searching without network access.
- **Flexible Routing Options**: Support multiple routing engines and use A* pathfinding on road and path graphs tagged with transport modes (car, walking, etc.).

## Workflow Summary
1. User searches for a region in the Geofabrik dataset.
2. User downloads the corresponding `.pbf` file via provided link.
3. The application loads the `.pbf` file and processes it with Tilemaker to generate vector tiles.
4. MapLibre renders the generated tiles and enables routing over the processed data.

## Technology Stack
- **Map Data**: Geofabrik OSM extracts (`.pbf`).
- **Tile Generation**: Tilemaker (vector tiles via MBTiles or directory of tiles).
- **Rendering Engine**: MapLibre (GL JS or Native, depending on platform).
- **Routing Engine**: Offline router (e.g., GraphHopper, OSRM, or custom A* implementation) seeded with the processed data.
- **Application Server**: Single Node.js (or similar) server delivering the PWA, serving tiles, and exposing routing and address APIs from one origin.
- **Local Storage**: Browser storage (IndexedDB or File System Access API) for tiles, routing graphs, and address indexes.

## References
- [OSM Offline Usage Guide](https://wiki.openstreetmap.org/wiki/Using_OpenStreetMap_offline)
- [CartoType reference](https://wiki.openstreetmap.org/wiki/CartoType)

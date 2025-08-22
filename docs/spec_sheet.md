# Offline OpenStreetMap Project Specification

## 1. User Interface
### 1.1 Geofabrik Search & Download
- Search box with auto-complete for regions/countries.
- Results show region name, size, and download link.
- Button to copy direct download URL or trigger in-app download.

### 1.2 Map Import & Processing
- File picker to load existing `.pbf` files.
- Progress indicators for download and tile generation steps.
- Error handling for unsupported or corrupted files.

### 1.3 Address & Route Query
- Search bar for offline address lookup backed by a local index.
- Route planner allowing selection of transport mode (car, walking, etc.).
- Installable Progressive Web App UI that works offline once assets and data are cached.

## 2. Map Processing Pipeline
- Use Tilemaker to convert `.pbf` to vector tiles (MBTiles format).
- Configuration files for features and styling stored in the project.
- Generated tiles saved in a local data directory with metadata.
- Build routing graphs annotated with access modes (car, walking, etc.) and run A* preprocessing where applicable.
- Extract and index address data for offline search.

## 3. Single-Server Backend
- One server process hosts the web UI, serves tiles, and exposes routing and address APIs from a single origin with no external database.

### 3.1 Tile Serving
- Local tile server serving MBTiles or unpacked tiles for MapLibre.
- Cache management and tile expiration policy.

### 3.2 Routing Engine
- Pluggable routing modules (GraphHopper, OSRM, or custom implementation).
- Preprocessed graphs store edges with mode attributes for cars, pedestrians, etc.
- A* used as the baseline algorithm for pathfinding.
- API endpoints for route queries (start/finish coordinates, mode of transport).

### 3.3 Address Search
- Local address index queried via an API endpoint for geocoding.
- Support for partial matches and ranking of results.

## 4. Map Rendering
- MapLibre GL JS configured to read local tile source and style JSON.
- Runs inside the PWA and uses cached assets for offline availability.
- Support for basic interactions: pan, zoom, select points.
- Optional layer controls for POIs, roads, and other features.

## 5. Data Management
- Directory structure (virtualized within browser storage):
  - `maps/` for downloaded `.pbf` files.
  - `tiles/` for generated MBTiles.
  - `graphs/` for routing graph data with transport permissions.
  - `addresses/` for offline address index.
  - `cache/` for temporary files.
- Metadata index to track available regions, tile status, and loaded routing/ address datasets.
- Use IndexedDB or File System Access API for persistence with no external database requirements.

## 6. Dependencies
- Tilemaker for vector tile generation.
- MapLibre for map rendering.
- Offline routing library options (GraphHopper, OSRM) or built-in A* implementation.
- Node.js server framework (e.g., Express) to deliver the PWA and APIs.
- Service worker support for offline caching.
- Standard libraries for HTTP requests, file I/O, and UI framework.

## 7. Future Enhancements
- Incremental map updates via diff downloads.
- Custom styling options for different map themes.
- Synchronization with external storage (e.g., SD card or cloud backup).

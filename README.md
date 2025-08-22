# Offline OpenStreetMap Application

A Progressive Web App for downloading, processing, and viewing OpenStreetMap data offline. **NEW: Now supports 100% browser-based processing!**

## 🚀 Browser-Only Processing (NEW!)

**No external dependencies required!** Process PBF files entirely in your browser using Web Workers:
- ✅ **Zero setup** - works immediately after `npm install`
- ✅ **No tilemaker installation** required
- ✅ **100% client-side** - no server processing needed
- ✅ **Offline capable** - save tiles to browser storage
- ✅ **Web Worker powered** - doesn't block the UI during processing

## Features Implemented

✅ **Geofabrik Search & Download**: Search and download regional OSM extracts  
✅ **Browser PBF Processing**: Convert PBF files to tiles entirely in browser  
✅ **Traditional Tile Processing**: Convert PBF files using Tilemaker (optional)  
✅ **Offline Map Display**: View maps using MapLibre GL JS  
✅ **Route Planning**: Basic routing functionality (click map to set points)  
✅ **File Management**: List and process downloaded files  
✅ **PWA Support**: Service worker and manifest for offline use

## Quick Start

### Option 1: Browser-Only (Recommended for small files)

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   ```

3. **Use Browser Processing**
   - Navigate to http://localhost:3000
   - Upload a PBF file (< 50MB recommended)
   - Click "🚀 Process in Browser"
   - View tiles immediately on the map!

### Option 2: Traditional (For large files)

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Install Tilemaker** (only if processing large files)
   - Download from: https://github.com/systemed/tilemaker/releases
   - Add `tilemaker.exe` to your PATH

3. **Start the Server**
   ```bash
   npm start
   ```

## Processing Methods Comparison

| Method | File Size | Setup Required | Performance | Best For |
|--------|-----------|----------------|-------------|----------|
| **Browser Processing** | < 50MB | None | Good for small files | Testing, development, no-setup scenarios |
| **Server Processing** | Any size | Node.js dependencies | Better for large files | Production, large datasets |
| **Tilemaker** | Any size | External binary | Best performance | Professional use, very large files |

## Usage Workflows

### Browser Processing Workflow (NEW!)
1. **Upload PBF File**: Drag & drop or select file (< 50MB recommended)
2. **Choose Options**: Select points, lines, polygons to include
3. **Process**: Click "🚀 Process in Browser" - uses Web Workers
4. **View Results**: Tiles load directly on map
5. **Save Offline**: Store in browser for later use

### Traditional Workflow
1. **Search for a Region**: Use the search box to find countries/regions (e.g., "Denmark")
2. **Download Data**: Click "Download" next to any search result
3. **Process Tiles**: In the "Downloaded Files" section, click "Generate Tiles"
4. **Load Map**: Once tiles are generated, click "Use These Tiles" to display the map
5. **Plan Routes**: Click on the map to set start/end points, then calculate routes

## File Structure

```
data/                      # Downloaded PBF files (e.g., denmark-latest.osm.pbf)
tiles/                     # Generated vector tiles organized by region
public/
  ├── browser-osm-processor.js  # NEW: Browser-based PBF processor
  ├── app.js                    # Frontend with browser processing UI
  ├── index.html                # Complete UI with browser processing section
  └── sw.js                     # Service worker for offline capability
docs/                      # Project documentation
PBF_PROCESSING_GUIDE.md   # Comprehensive guide to processing methods
```

## Technical Architecture

### Browser Processing
- **Web Workers**: Offloads processing to background threads
- **Streaming**: Handles large files without blocking UI
- **IndexedDB**: Stores generated tiles for offline use
- **Pure JavaScript**: No external binaries required

### Server Processing
- **Express API**: Handles file uploads and processing
- **Multiple backends**: Supports tilemaker, Node.js parsing, or direct methods
- **Streaming downloads**: Efficient handling of large Geofabrik files

## Current Implementation Status

- **Browser Processing**: ✅ Full implementation with Web Workers
- **Core Functionality**: ✅ Search, download, tile processing, map display
- **Route Planning**: ⚠️ Basic implementation (straight-line routing)
- **Address Search**: ⚠️ Placeholder (not yet connected to local index)
- **Advanced Routing**: ❌ Requires integration with OSRM/GraphHopper

## Dependencies

### Required
- **Node.js** (v16+) with ES module support
- **Express** (web server and API)
- **MapLibre GL JS** (map rendering)

### Optional (for advanced processing)
- **Tilemaker** (tile generation) - only needed for large files
- **osm-pbf-parser** (server-side PBF parsing)

## Browser Compatibility

Browser processing requires:
- **Web Workers** support (all modern browsers)
- **IndexedDB** for offline storage (all modern browsers)
- **File API** for local file handling (all modern browsers)

Works in: Chrome 60+, Firefox 55+, Safari 11+, Edge 79+

## Why Browser Processing?

Traditional OSM workflows require complex toolchains:
- Install tilemaker/osmium/imposm
- Set up databases
- Configure processing scripts
- Manage server resources

**Browser processing eliminates all of this:**
- Drop a PBF file → Get interactive tiles
- No installation, no configuration, no external tools
- Perfect for education, prototyping, and small-scale projects

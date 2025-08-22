// Offline OSM Maps - Clean, Map-Focused Application
// Browser-based PBF processing with beautiful UI

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// Global state
let map;
let browserProcessor = null;
let currentTileLayer = null;
let mapLayers = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  initializeMap();
  setupFileDropZone();
  setupUIEventListeners();
});

// Initialize MapLibre map
function initializeMap() {
  map = new maplibregl.Map({
    container: 'map',
    style: {
      version: 8,
      sources: {},
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: { 
            'background-color': '#f8f9fa' 
          }
        }
      ]
    },
    center: [12.6, 55.7], // Denmark center
    zoom: 6
  });

  // Add navigation controls
  map.addControl(new maplibregl.NavigationControl(), 'top-right');
  
  // Add click handler for feature info
  map.on('click', onMapClick);
  
  // Update map info overlay
  map.on('move', updateMapInfo);
  map.on('zoom', updateMapInfo);
  
  // Show offline message
  map.on('load', () => {
    document.getElementById('mapInfoContent').innerHTML = `
      <h4>🔌 Offline Map</h4>
      <p>This map works completely offline!</p>
      <p>📁 Upload a PBF file to see map data</p>
      <p>🔍 Search for regions to download</p>
    `;
    document.getElementById('mapInfo').classList.remove('hidden');
  });
}

// Setup file drop zone
function setupFileDropZone() {
  const dropZone = document.getElementById('fileDropZone');
  const fileInput = document.getElementById('browser-file-picker');
  
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });
  
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      fileInput.files = files;
      const file = files[0];
      if (file.name.endsWith('.pbf') || file.name.endsWith('.osm.pbf')) {
        showFileInfo(file);
      }
    }
  });
  
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      showFileInfo(e.target.files[0]);
    }
  });
}

// Setup UI event listeners
function setupUIEventListeners() {
  // Search input enter key
  document.getElementById('query').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      search();
    }
  });
}

// Show file information
function showFileInfo(file) {
  const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
  const statusDiv = document.getElementById('browser-processing-status');
  
  statusDiv.innerHTML = `
    <div class="status-message status-info">
      <strong>📁 File Selected:</strong> ${file.name}<br>
      <strong>📏 Size:</strong> ${fileSizeMB} MB<br>
      <strong>💡 Recommendation:</strong> ${fileSizeMB < 50 ? 'Perfect for browser processing!' : 'Large file - may be slow in browser'}
    </div>
  `;
}

// Search for regions
async function search() {
  const query = document.getElementById('query').value.trim();
  if (!query) return;
  
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '<div class="status-message status-info">🔍 Searching...</div>';
  
  try {
    const response = await fetch(`/api/geofabrik/search?q=${encodeURIComponent(query)}`);
    const results = await response.json();
    
    if (results.length === 0) {
      resultsDiv.innerHTML = '<div class="status-message status-warning">No regions found. Try searching for countries, states, or cities.</div>';
      return;
    }
    
    resultsDiv.innerHTML = results.map(result => `
      <div class="result-item">
        <h4>${result.name}</h4>
        <div class="actions">
          <button class="btn btn-primary" onclick="downloadRegion('${result.url}', '${result.name}')">
            📥 Download
          </button>
          <button class="btn btn-secondary" onclick="previewRegion('${result.name}')">
            👁️ Preview
          </button>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    resultsDiv.innerHTML = '<div class="status-message status-error">❌ Search failed. Check your connection.</div>';
  }
}

// Download region
async function downloadRegion(url, name) {
  const resultsDiv = document.getElementById('results');
  const originalContent = resultsDiv.innerHTML;
  
  resultsDiv.innerHTML = `<div class="status-message status-info">📥 Downloading ${name}...</div>`;
  
  try {
    const response = await fetch('/api/geofabrik/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    
    const result = await response.json();
    
    if (result.saved) {
      resultsDiv.innerHTML = `
        <div class="status-message status-success">
          ✅ Downloaded ${name} successfully!<br>
          <strong>File:</strong> ${result.saved}<br>
          <button class="btn btn-success" onclick="loadDownloadedFile('${result.saved}')">
            🚀 Process This File
          </button>
        </div>
      `;
    } else {
      throw new Error(result.error || 'Download failed');
    }
    
  } catch (error) {
    resultsDiv.innerHTML = originalContent;
    alert(`❌ Download failed: ${error.message}`);
  }
}

// Load downloaded file into processor
function loadDownloadedFile(filename) {
  // This would need to be implemented to load server files
  // For now, show a message
  alert(`To process ${filename}, please upload it using the file picker above.`);
}

// Preview region (zoom to approximate location)
function previewRegion(name) {
  // Simple country/region coordinates lookup
  const locations = {
    'Denmark': [12.6, 55.7, 8],
    'Germany': [10.5, 51.2, 6],
    'France': [2.3, 46.6, 6],
    'United Kingdom': [-2.0, 54.0, 6],
    'Netherlands': [5.3, 52.1, 7],
    'Sweden': [15.0, 62.0, 5],
    'Norway': [9.0, 64.0, 5],
    'Finland': [26.0, 64.0, 5],
    'Poland': [20.0, 52.0, 6],
    'Italy': [12.5, 42.8, 6],
    'Spain': [-3.7, 40.4, 6],
    'London': [-0.1, 51.5, 10],
    'Berlin': [13.4, 52.5, 10],
    'Paris': [2.3, 48.9, 10],
    'Copenhagen': [12.6, 55.7, 11]
  };
  
  for (const [location, coords] of Object.entries(locations)) {
    if (name.toLowerCase().includes(location.toLowerCase())) {
      map.flyTo({
        center: [coords[0], coords[1]],
        zoom: coords[2],
        duration: 2000
      });
      return;
    }
  }
  
  // Default to world view if not found
  map.flyTo({
    center: [0, 0],
    zoom: 2,
    duration: 2000
  });
}

// Process PBF file in browser
async function processBrowserPBF() {
  const fileInput = document.getElementById('browser-file-picker');
  const statusDiv = document.getElementById('browser-processing-status');
  const resultDiv = document.getElementById('browser-processing-result');
  const processBtn = document.getElementById('browser-process-btn');
  
  if (!fileInput.files || !fileInput.files[0]) {
    alert('Please select a PBF file first');
    return;
  }
  
  const file = fileInput.files[0];
  const includePoints = document.getElementById('include-points').checked;
  const includeLines = document.getElementById('include-lines').checked;
  const includePolygons = document.getElementById('include-polygons').checked;
  const maxZoom = parseInt(document.getElementById('max-zoom').value);
  
  // Validate file size
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > 100) {
    if (!confirm(`File is ${fileSizeMB.toFixed(1)}MB. Large files may be slow or crash the browser. Continue?`)) {
      return;
    }
  }
  
  processBtn.disabled = true;
  processBtn.innerHTML = '<span class="loading-spinner"></span> Processing...';
  statusDiv.innerHTML = '';
  resultDiv.innerHTML = '';
  
  try {
    // Initialize processor
    if (!browserProcessor) {
      browserProcessor = new BrowserOSMProcessor();
    }
    
    const result = await browserProcessor.processPBFFile(file, {
      maxZoom,
      includePoints,
      includeLines,
      includePolygons,
      onProgress: (progress, message) => {
        const percent = Math.round(progress * 100);
        statusDiv.innerHTML = `
          <div class="status-message status-info">
            <div style="margin-bottom: 8px;">⚡ ${message}</div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${percent}%"></div>
            </div>
            <div style="text-align: center; font-size: 12px; margin-top: 5px;">${percent}%</div>
          </div>
        `;
      }
    });
    
    if (result.success) {
      statusDiv.innerHTML = '<div class="status-message status-success">✅ Processing complete!</div>';
      
      resultDiv.innerHTML = `
        <div class="status-message status-success">
          <h4>🎉 Success!</h4>
          <p><strong>Features:</strong> ${result.stats.features.toLocaleString()}</p>
          <p><strong>Tiles:</strong> ${result.stats.tiles.toLocaleString()}</p>
          <p><strong>Max Zoom:</strong> ${result.stats.maxZoom}</p>
          
          <div style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="loadBrowserTiles('${file.name}')">
              🗺️ Show on Map
            </button>
            <button class="btn btn-info" onclick="showTileStats('${file.name}')">
              📊 Statistics
            </button>
          </div>
        </div>
      `;
      
      // Store tiles globally
      window.browserGeneratedTiles = result.tiles;
      window.browserTileMetadata = result.metadata;
      window.browserOriginalFeatures = result.originalFeatures; // Store original GeoJSON
      
      // Update layers list
      updateLayersList(file.name, result.stats);
      
    } else {
      statusDiv.innerHTML = '<div class="status-message status-error">❌ Processing failed</div>';
      resultDiv.innerHTML = `
        <div class="status-message status-error">
          <h4>⚠️ Processing Failed</h4>
          <p>${result.error}</p>
          <p><strong>Suggestion:</strong> ${result.fallback || 'Try a smaller file'}</p>
        </div>
      `;
    }
    
  } catch (error) {
    statusDiv.innerHTML = '<div class="status-message status-error">❌ Processing error</div>';
    resultDiv.innerHTML = `
      <div class="status-message status-error">
        <h4>💥 Error</h4>
        <p>${error.message}</p>
        <p>File size: ${fileSizeMB.toFixed(1)}MB</p>
      </div>
    `;
  } finally {
    processBtn.disabled = false;
    processBtn.innerHTML = '🚀 Process in Browser';
  }
}

// Load browser-generated tiles on map
function loadBrowserTiles(filename) {
  if (!window.browserGeneratedTiles) {
    alert('No tiles available. Process a file first.');
    return;
  }
  
  const tileName = filename.replace(/\.(osm\.)?pbf$/, '');
  
  // Remove existing layers
  if (currentTileLayer) {
    removeCurrentLayer();
  }
  
  currentTileLayer = `browser-tiles-${tileName}`;
  
  // Generate all tiles for visible zoom levels and create blob URLs
  generateTileUrls().then(tileUrls => {
    if (tileUrls.length === 0) {
      console.warn('No tiles generated');
      return;
    }
    
    // Create a simple GeoJSON source with the original features for now
    map.addSource(currentTileLayer, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: window.browserGeneratedTiles.originalFeatures || []
      }
    });
    
    // Add styled layers for different feature types
    addStyledLayers(currentTileLayer);
    
    // Fit map to bounds
    if (window.browserTileMetadata?.bounds) {
      const bounds = window.browserTileMetadata.bounds;
      map.fitBounds([
        [bounds[0], bounds[1]],
        [bounds[2], bounds[3]]
      ], { padding: 50 });
    }
    
    // Update map info
    document.getElementById('mapInfo').classList.remove('hidden');
    document.getElementById('mapInfoContent').innerHTML = `
      <p><strong>Layer:</strong> ${tileName}</p>
      <p><strong>Type:</strong> Vector Features</p>
      <p>🗺️ Features: ${window.browserGeneratedTiles.originalFeatures?.length || 0}</p>
    `;
    
    // Update active layer in sidebar
    updateActiveLayer(tileName);
  });
}

// Generate tile URLs for a range of zoom levels
async function generateTileUrls() {
  const tileUrls = [];
  
  if (!window.browserGeneratedTiles || !window.browserGeneratedTiles.originalFeatures) {
    console.log('No features available for tile generation');
    return tileUrls;
  }
  
  // For now, just return a signal that we have features to work with
  console.log('Features available:', window.browserGeneratedTiles.originalFeatures.length);
  return ['dummy']; // Signal that we have data
}

// Add styled layers for different feature types
function addStyledLayers(sourceId) {
  // Add polygon layers (buildings, areas)
  map.addLayer({
    id: `${sourceId}-polygons`,
    source: sourceId,
    type: 'fill',
    filter: ['==', ['geometry-type'], 'Polygon'],
    paint: {
      'fill-color': [
        'case',
        ['has', 'building'], '#e8e8e8',
        ['==', ['get', 'natural'], 'water'], '#a8d0f0',
        ['==', ['get', 'landuse'], 'forest'], '#c8d9b8',
        ['==', ['get', 'landuse'], 'residential'], '#f2f1f0',
        ['==', ['get', 'landuse'], 'commercial'], '#f7f5f3',
        '#f0f0f0'
      ],
      'fill-opacity': 0.8
    }
  });

  // Add polygon outlines
  map.addLayer({
    id: `${sourceId}-polygon-outlines`,
    source: sourceId,
    type: 'line',
    filter: ['==', ['geometry-type'], 'Polygon'],
    paint: {
      'line-color': [
        'case',
        ['has', 'building'], '#d0d0d0',
        ['==', ['get', 'natural'], 'water'], '#7bb8e8',
        '#d8d8d8'
      ],
      'line-width': 1,
      'line-opacity': 0.6
    }
  });

  // Add roads and highways
  map.addLayer({
    id: `${sourceId}-roads`,
    source: sourceId,
    type: 'line',
    filter: ['==', ['geometry-type'], 'LineString'],
    paint: {
      'line-color': [
        'case',
        ['==', ['get', 'highway'], 'motorway'], '#e67c73',
        ['==', ['get', 'highway'], 'trunk'], '#f6a192',
        ['==', ['get', 'highway'], 'primary'], '#f9bc9c',
        ['==', ['get', 'highway'], 'secondary'], '#ffd4a3',
        ['==', ['get', 'highway'], 'residential'], '#ffffff',
        ['==', ['get', 'railway'], 'rail'], '#888888',
        '#e8e8e8'
      ],
      'line-width': [
        'case',
        ['==', ['get', 'highway'], 'motorway'], 6,
        ['==', ['get', 'highway'], 'trunk'], 5,
        ['==', ['get', 'highway'], 'primary'], 4,
        ['==', ['get', 'highway'], 'secondary'], 3,
        ['==', ['get', 'highway'], 'residential'], 2,
        ['==', ['get', 'railway'], 'rail'], 2,
        1
      ],
      'line-opacity': 0.9
    }
  });

  // Add points of interest
  map.addLayer({
    id: `${sourceId}-points`,
    source: sourceId,
    type: 'circle',
    filter: ['==', ['geometry-type'], 'Point'],
    paint: {
      'circle-color': [
        'case',
        ['has', 'amenity'], '#4285f4',
        ['has', 'shop'], '#ea4335',
        ['has', 'tourism'], '#34a853',
        '#9aa0a6'
      ],
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        10, 2,
        15, 4,
        20, 6
      ],
      'circle-opacity': 0.8,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 1
    }
  });
}

// Remove current layer
function removeCurrentLayer() {
  if (currentTileLayer) {
    // Remove all related layers
    const layersToRemove = [
      currentTileLayer,
      `${currentTileLayer}-polygons`,
      `${currentTileLayer}-polygon-outlines`,
      `${currentTileLayer}-roads`,
      `${currentTileLayer}-points`
    ];
    
    layersToRemove.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    });
    
    // Remove the source
    if (map.getSource(currentTileLayer)) {
      map.removeSource(currentTileLayer);
    }
  }
}

// Convert tile coordinates to geographic coordinates
function convertTileFeatureToGeo(feature, tileX, tileY, zoom) {
  const scale = Math.pow(2, zoom);
  const tileSize = 4096;
  
  const convertCoord = ([x, y]) => {
    const lon = (tileX + x / tileSize) / scale * 360 - 180;
    const n = Math.PI - 2 * Math.PI * (tileY + y / tileSize) / scale;
    const lat = 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
    return [lon, lat];
  };
  
  try {
    let newGeometry;
    const geom = feature.geometry;
    
    switch (geom.type) {
      case 'Point':
        newGeometry = {
          type: 'Point',
          coordinates: convertCoord(geom.coordinates)
        };
        break;
      case 'LineString':
        newGeometry = {
          type: 'LineString',
          coordinates: geom.coordinates.map(convertCoord)
        };
        break;
      case 'Polygon':
        newGeometry = {
          type: 'Polygon',
          coordinates: geom.coordinates.map(ring => ring.map(convertCoord))
        };
        break;
      default:
        return null;
    }
    
    return {
      type: 'Feature',
      geometry: newGeometry,
      properties: feature.properties || {}
    };
  } catch (error) {
    return null;
  }
}

// Remove duplicate features
function removeDuplicateFeatures(features) {
  const unique = [];
  const seen = new Set();
  
  features.forEach(feature => {
    const id = feature.properties?.osm_id;
    if (id && !seen.has(id)) {
      seen.add(id);
      unique.push(feature);
    } else if (!id) {
      unique.push(feature);
    }
  });
  
  return unique;
}

// Update layers list in sidebar
function updateLayersList(filename, stats) {
  const layersList = document.getElementById('map-layers-list');
  const layerId = filename.replace(/\.(osm\.)?pbf$/, '');
  
  // Remove existing layer if present
  const existingLayer = document.getElementById(`layer-${layerId}`);
  if (existingLayer) {
    existingLayer.remove();
  }
  
  // Add new layer
  const layerElement = document.createElement('div');
  layerElement.id = `layer-${layerId}`;
  layerElement.className = 'result-item';
  layerElement.innerHTML = `
    <h4>📁 ${filename}</h4>
    <p style="font-size: 12px; color: #666; margin: 5px 0;">
      ${stats.features.toLocaleString()} features • ${stats.tiles.toLocaleString()} tiles
    </p>
    <div class="actions">
      <button class="btn btn-primary" onclick="loadBrowserTiles('${filename}')">
        🗺️ Show
      </button>
      <button class="btn btn-secondary" onclick="hideLayer('${layerId}')">
        👁️ Hide
      </button>
    </div>
  `;
  
  // Replace the "no layers" message or add to existing layers
  if (layersList.innerHTML.includes('No layers loaded')) {
    layersList.innerHTML = '';
  }
  layersList.appendChild(layerElement);
}

// Update active layer styling
function updateActiveLayer(layerId) {
  // Remove active class from all layers
  document.querySelectorAll('#map-layers-list .result-item').forEach(item => {
    item.style.background = '#f8f9fa';
  });
  
  // Add active styling to current layer
  const activeLayer = document.getElementById(`layer-${layerId}`);
  if (activeLayer) {
    activeLayer.style.background = '#e8f5e8';
  }
}

// Hide layer
function hideLayer(layerId) {
  removeCurrentLayer();
  currentTileLayer = null;
  
  // Update layers list styling
  document.querySelectorAll('#map-layers-list .result-item').forEach(item => {
    item.style.background = '#f8f9fa';
  });
  
  // Hide map info
  document.getElementById('mapInfo').classList.add('hidden');
}

// Show tile statistics
function showTileStats(filename) {
  if (!window.browserGeneratedTiles || !window.browserTileMetadata) {
    alert('No tile data available.');
    return;
  }
  
  const tiles = window.browserGeneratedTiles;
  const metadata = window.browserTileMetadata;
  
  let totalFeatures = 0;
  let featureTypes = { Point: 0, LineString: 0, Polygon: 0 };
  
  Object.values(tiles).forEach(zoomLevel => {
    Object.values(zoomLevel).forEach(tile => {
      if (tile.layers && tile.layers.osm) {
        tile.layers.osm.features.forEach(feature => {
          totalFeatures++;
          featureTypes[feature.geometry.type] = (featureTypes[feature.geometry.type] || 0) + 1;
        });
      }
    });
  });
  
  const stats = `📊 Statistics for ${filename}

🗺️ Coverage:
• Bounds: ${metadata.bounds.map(n => n.toFixed(4)).join(', ')}
• Center: ${metadata.center.map(n => n.toFixed(4)).join(', ')}
• Zoom levels: ${metadata.minzoom} - ${metadata.maxzoom}

📦 Tiles:
• Total tiles: ${Object.values(tiles).reduce((sum, zoom) => sum + Object.keys(zoom).length, 0)}

🎯 Features:
• Total: ${totalFeatures.toLocaleString()}
• Points: ${featureTypes.Point.toLocaleString()}
• Lines: ${featureTypes.LineString.toLocaleString()}  
• Polygons: ${featureTypes.Polygon.toLocaleString()}

💾 Processing:
• Method: 100% browser-based
• No external dependencies
• Storage: ${(JSON.stringify(tiles).length / 1024 / 1024).toFixed(2)} MB`;
  
  alert(stats);
}

// Toggle sidebar
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggleIcon = document.getElementById('sidebar-toggle-icon');
  
  sidebar.classList.toggle('collapsed');
  toggleIcon.textContent = sidebar.classList.contains('collapsed') ? '›' : '‹';
}

// Reset map view
function resetMapView() {
  map.flyTo({
    center: [12.6, 55.7],
    zoom: 6,
    duration: 1000
  });
}

// Toggle map style (offline themes only)
let currentMapStyle = 'light';
function toggleMapStyle() {
  if (currentMapStyle === 'light') {
    // Switch to dark theme
    map.setStyle({
      version: 8,
      sources: {},
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: { 
            'background-color': '#2c3e50' 
          }
        }
      ]
    });
    currentMapStyle = 'dark';
  } else {
    // Switch back to light theme
    map.setStyle({
      version: 8,
      sources: {},
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: { 
            'background-color': '#f8f9fa' 
          }
        }
      ]
    });
    currentMapStyle = 'light';
  }
  
  // Re-add any custom layers after style change
  if (currentTileLayer && window.browserGeneratedTiles) {
    setTimeout(() => {
      // Re-add the processed data
      const filename = currentTileLayer.replace('browser-tiles-', '') + '.pbf';
      loadBrowserTiles(filename);
    }, 100);
  }
}

// Handle map clicks
function onMapClick(e) {
  const features = map.queryRenderedFeatures(e.point);
  
  if (features.length > 0) {
    const feature = features[0];
    const props = feature.properties;
    
    let info = '<h4>📍 Feature Info</h4>';
    
    if (props.osm_id) {
      info += `<p><strong>OSM ID:</strong> ${props.osm_id}</p>`;
    }
    
    if (props.osm_type) {
      info += `<p><strong>Type:</strong> ${props.osm_type}</p>`;
    }
    
    // Show interesting properties
    const interestingProps = ['name', 'amenity', 'shop', 'highway', 'building', 'natural', 'landuse', 'tourism'];
    interestingProps.forEach(prop => {
      if (props[prop]) {
        info += `<p><strong>${prop}:</strong> ${props[prop]}</p>`;
      }
    });
    
    document.getElementById('mapInfoContent').innerHTML = info;
    document.getElementById('mapInfo').classList.remove('hidden');
  }
}

// Update map info overlay
function updateMapInfo() {
  const center = map.getCenter();
  const zoom = map.getZoom();
  
  // Only update if no feature is selected
  if (document.getElementById('mapInfoContent').innerHTML.includes('Click on features')) {
    document.getElementById('mapInfoContent').innerHTML = `
      <p><strong>Center:</strong> ${center.lng.toFixed(4)}, ${center.lat.toFixed(4)}</p>
      <p><strong>Zoom:</strong> ${zoom.toFixed(1)}</p>
      <p>Click on features to see details</p>
    `;
  }
}

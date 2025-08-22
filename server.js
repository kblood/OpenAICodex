import express from 'express';
import fetch from 'node-fetch';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { DirectPBFProcessor, getBasicPBFInfo } from './pbf-processor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const TILE_DIR = path.join(__dirname, 'tiles');
const TILEMAKER_DIR = path.join(__dirname, 'tilemaker');

// Initialize PBF processor
const pbfProcessor = new DirectPBFProcessor(DATA_DIR, TILE_DIR);

// Function to find and extract tilemaker if needed
function ensureTilemaker() {
  const zipPath = path.join(__dirname, 'tilemaker-windows.zip');
  const exePath = path.join(TILEMAKER_DIR, 'tilemaker.exe');
  
  if (fs.existsSync(exePath)) {
    console.log('Tilemaker already extracted at:', exePath);
    return exePath;
  }
  
  // Try to find tilemaker.exe in subdirectories of tilemaker folder
  if (fs.existsSync(TILEMAKER_DIR)) {
    function findTilemaker(dir) {
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          if (fs.statSync(fullPath).isDirectory()) {
            const found = findTilemaker(fullPath);
            if (found) return found;
          } else if (item === 'tilemaker.exe') {
            return fullPath;
          }
        }
      } catch (e) {
        // Ignore errors
      }
      return null;
    }
    
    const foundExe = findTilemaker(TILEMAKER_DIR);
    if (foundExe) {
      console.log('Tilemaker found at:', foundExe);
      return foundExe;
    }
  }
  
  if (fs.existsSync(zipPath)) {
    console.log('tilemaker-windows.zip found but not extracted yet');
    console.log('Please manually extract tilemaker-windows.zip to the tilemaker folder');
    return null;
  }
  
  console.log('Tilemaker not found - will try system PATH');
  return null;
}

// Get the path to tilemaker executable
function getTilemakerPath() {
  // First try local extracted version
  const localPath = ensureTilemaker();
  if (localPath && fs.existsSync(localPath)) {
    return localPath;
  }
  
  // Fall back to system PATH
  return 'tilemaker';
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DATA_DIR);
  },
  filename: (req, file, cb) => {
    // Keep original filename but ensure .pbf extension
    let filename = file.originalname;
    if (!filename.endsWith('.pbf') && !filename.endsWith('.osm.pbf')) {
      filename += '.osm.pbf';
    }
    cb(null, filename);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Accept .pbf and .osm.pbf files
    if (file.originalname.match(/\.(pbf|osm\.pbf)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only .pbf and .osm.pbf files are allowed'), false);
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024 // 2GB limit
  }
});

app.use(express.json());
app.use(express.static('public'));
app.use('/tiles', express.static(TILE_DIR));

// Serve tiny-osmpbf library and dependencies for browser use
app.get('/tiny-osmpbf', (req, res) => {
  try {
    const tinyOSMPBFPath = path.join(__dirname, 'node_modules', 'tiny-osmpbf', 'index.js');
    const pbfPath = path.join(__dirname, 'node_modules', 'pbf', 'index.js');
    const tinyInflatePath = path.join(__dirname, 'node_modules', 'tiny-inflate', 'index.js');
    const fileFormatPath = path.join(__dirname, 'node_modules', 'tiny-osmpbf', 'proto', 'fileformat.js');
    const osmFormatPath = path.join(__dirname, 'node_modules', 'tiny-osmpbf', 'proto', 'osmformat.js');
    
    if (fs.existsSync(tinyOSMPBFPath) && fs.existsSync(pbfPath) && fs.existsSync(tinyInflatePath) &&
        fs.existsSync(fileFormatPath) && fs.existsSync(osmFormatPath)) {
      
      // Read all source files
      let tinyInflateContent = fs.readFileSync(tinyInflatePath, 'utf8');
      let pbfContent = fs.readFileSync(pbfPath, 'utf8');
      let fileFormatContent = fs.readFileSync(fileFormatPath, 'utf8');
      let osmFormatContent = fs.readFileSync(osmFormatPath, 'utf8');
      let tinyOSMPBFContent = fs.readFileSync(tinyOSMPBFPath, 'utf8');
      
      // Transform the tiny-osmpbf content to replace all require statements
      tinyOSMPBFContent = tinyOSMPBFContent
        .replace(/var inflate = require\('tiny-inflate'\)/g, 'var inflate = window.tinyInflate')
        .replace(/var Pbf = require\('pbf'\)/g, 'var Pbf = window.Pbf')
        .replace(/var FileFormat = require\('\.\/proto\/fileformat\.js'\)/g, 'var FileFormat = window.FileFormat')
        .replace(/var OsmFormat = require\('\.\/proto\/osmformat\.js'\)/g, 'var OsmFormat = window.OsmFormat')
        .replace(/require\('tiny-inflate'\)/g, 'window.tinyInflate')
        .replace(/require\('pbf'\)/g, 'window.Pbf')
        .replace(/require\('\.\/proto\/fileformat\.js'\)/g, 'window.FileFormat')
        .replace(/require\('\.\/proto\/osmformat\.js'\)/g, 'window.OsmFormat');
      
      const browserBundle = `
(function() {
  'use strict';
  
  // Browser polyfill for Buffer
  if (typeof Buffer === 'undefined') {
    window.Buffer = function(data, encoding) {
      if (data instanceof Uint8Array) return data;
      if (Array.isArray(data)) return new Uint8Array(data);
      if (typeof data === 'string') {
        return new TextEncoder().encode(data);
      }
      return new Uint8Array(0);
    };
    window.Buffer.from = function(data, encoding) {
      if (data instanceof Uint8Array) return data;
      if (typeof data === 'string') {
        return new TextEncoder().encode(data);
      }
      if (Array.isArray(data)) return new Uint8Array(data);
      return new Uint8Array(data || 0);
    };
  }

  // tiny-inflate
  (function() {
    var module = { exports: {} };
    var exports = module.exports;
    ${tinyInflateContent}
    window.tinyInflate = module.exports;
  })();

  // pbf library
  (function() {
    var module = { exports: {} };
    var exports = module.exports;
    ${pbfContent}
    window.Pbf = module.exports;
  })();

  // FileFormat protocol buffer definitions
  (function() {
    var module = { exports: {} };
    var exports = module.exports;
    ${fileFormatContent}
    window.FileFormat = module.exports;
  })();

  // OsmFormat protocol buffer definitions
  (function() {
    var module = { exports: {} };
    var exports = module.exports;
    ${osmFormatContent}
    window.OsmFormat = module.exports;
  })();

  // tiny-osmpbf main library
  (function() {
    var module = { exports: {} };
    var exports = module.exports;
    
    ${tinyOSMPBFContent}
    
    window.tinyosmpbf = module.exports;
  })();

  console.log('tiny-osmpbf bundle loaded successfully');
})();`;

      res.type('application/javascript');
      res.send(browserBundle);
    } else {
      console.log('Missing files for tiny-osmpbf bundle');
      res.status(404).send('tiny-osmpbf dependencies not found');
    }
  } catch (error) {
    console.error('Error serving tiny-osmpbf:', error);
    res.status(500).send('Error loading tiny-osmpbf: ' + error.message);
  }
});

// Quiet favicon requests if no icon file is present (index.html provides a data URL icon)
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Status endpoint to check tilemaker availability
app.get('/api/status', (req, res) => {
  const tilemakerPath = getTilemakerPath();
  const zipExists = fs.existsSync(path.join(__dirname, 'tilemaker-windows.zip'));
  const extractedExists = fs.existsSync(path.join(TILEMAKER_DIR, 'tilemaker.exe'));
  
  res.json({
    tilemaker: {
      path: tilemakerPath,
      available: tilemakerPath !== 'tilemaker' || extractedExists,
      zipExists,
      extractedExists,
      extractDir: TILEMAKER_DIR
    },
    directories: {
      data: DATA_DIR,
      tiles: TILE_DIR,
      tilemaker: TILEMAKER_DIR
    }
  });
});

// Ensure directories exist
for (const dir of [DATA_DIR, TILE_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Search Geofabrik index for regions matching query
// Cache the index in-memory briefly to avoid repeated downloads
let GEOFABRIK_CACHE = { ts: 0, data: null };
app.get('/api/geofabrik/search', async (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  if (!q) return res.json([]);
  try {
    if (!GEOFABRIK_CACHE.data || Date.now() - GEOFABRIK_CACHE.ts > 5 * 60 * 1000) {
      const resp = await fetch('https://download.geofabrik.de/index-v1.json');
      if (!resp.ok) throw new Error(`Geofabrik index fetch failed: ${resp.status}`);
      const json = await resp.json();
      GEOFABRIK_CACHE = { ts: Date.now(), data: json };
    }
    const json = GEOFABRIK_CACHE.data;
    const features = Array.isArray(json?.features) ? json.features : [];
    const matches = features
      .filter(f => f?.properties?.urls?.pbf)
      .filter(f => {
        const p = f.properties;
        const hay = [p.name, p.id, ...(Array.isArray(p['iso3166-1:alpha2']) ? p['iso3166-1:alpha2'] : [])]
          .filter(Boolean)
          .join(' ') // join searchable tokens
          .toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 50) // limit results
      .map(f => ({
        id: f.properties.id,
        name: f.properties.name,
        url: f.properties.urls.pbf
      }));
    res.json(matches);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Download PBF file to data directory
app.post('/api/geofabrik/download', async (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'url required' });
  
  const filename = path.basename(url);
  const filepath = path.join(DATA_DIR, filename);
  
  try {
    console.log(`Starting download: ${url} -> ${filepath}`);
    const resp = await fetch(url);
    if (!resp.ok || !resp.body) throw new Error(`Download failed: ${resp.status} ${resp.statusText}`);
    
    const fileStream = fs.createWriteStream(filepath);
    
    // Track download progress
    const contentLength = parseInt(resp.headers.get('content-length') || '0');
    let downloadedBytes = 0;
    
    // node-fetch v3 returns a Web ReadableStream; bridge it to Node stream with progress tracking
    const readable = Readable.fromWeb(resp.body);
    readable.on('data', (chunk) => {
      downloadedBytes += chunk.length;
      if (contentLength > 0) {
        const percent = Math.round((downloadedBytes / contentLength) * 100);
        console.log(`Download progress: ${percent}% (${Math.round(downloadedBytes/1024/1024)}MB / ${Math.round(contentLength/1024/1024)}MB)`);
      }
    });
    
    await pipeline(readable, fileStream);
    
    const stats = fs.statSync(filepath);
    console.log(`Download completed: ${filename} (${Math.round(stats.size/1024/1024)}MB)`);
    
    res.json({ 
      saved: filepath, 
      filename: filename,
      size: stats.size 
    });
  } catch (e) {
    console.error('Download error:', e);
    // Clean up partial file on error
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
    res.status(500).json({ error: 'download failed', details: e.message });
  }
});

// Check if tilemaker is available
app.get('/api/tilemaker/check', (req, res) => {
  exec('tilemaker --help', (err, stdout, stderr) => {
    if (err) {
      res.json({ 
        available: false, 
        error: err.message,
        installUrl: 'https://github.com/systemed/tilemaker/releases'
      });
    } else {
      res.json({ 
        available: true, 
        version: stdout.split('\n')[0] || 'Unknown version'
      });
    }
  });
});

// Process PBF file with tilemaker to generate vector tiles
app.post('/api/tilemaker/process', (req, res) => {
  const { pbf } = req.body || {};
  if (!pbf) return res.status(400).json({ error: 'pbf path required' });
  
  const pbfPath = path.join(DATA_DIR, pbf);
  if (!fs.existsSync(pbfPath)) {
    return res.status(404).json({ error: 'PBF file not found' });
  }
  
  const outputDir = path.join(TILE_DIR, path.basename(pbf, '.osm.pbf'));
  
  // Check if tilemaker is available
  exec('tilemaker --help', (helpErr) => {
    if (helpErr) {
      console.error('Tilemaker not found in PATH:', helpErr.message);
      return res.status(500).json({ 
        error: 'tilemaker not found', 
        details: 'Please install tilemaker and add it to your PATH. Download from: https://github.com/systemed/tilemaker/releases',
        helpUrl: 'https://github.com/systemed/tilemaker/releases'
      });
    }
    
    // Check if config files exist, create simple ones if missing
    const configPath = path.join(process.cwd(), 'tilemaker-config.json');
    const processPath = path.join(process.cwd(), 'tilemaker-process.lua');
    
    if (!fs.existsSync(configPath) || !fs.existsSync(processPath)) {
      console.log('Creating basic tilemaker config files...');
      
      // Create basic config if missing
      if (!fs.existsSync(configPath)) {
        const basicConfig = {
          "layers": {
            "water": { "minzoom": 0, "maxzoom": 14 },
            "transportation": { "minzoom": 4, "maxzoom": 14 },
            "buildings": { "minzoom": 12, "maxzoom": 14 }
          },
          "settings": { "minzoom": 0, "maxzoom": 14, "compress": "gzip" }
        };
        fs.writeFileSync(configPath, JSON.stringify(basicConfig, null, 2));
      }
      
      // Create basic process script if missing
      if (!fs.existsSync(processPath)) {
        const basicProcess = `-- Basic tilemaker process
function node_function(node)
  if node.tags.place then
    node:Layer("places", false)
    node:Attribute("name", node.tags.name or "")
  end
end

function way_function(way)
  if way.tags.natural == "water" or way.tags.waterway then
    way:Layer("water", true)
    way:Attribute("class", way.tags.natural or way.tags.waterway)
  end
  if way.tags.highway then
    way:Layer("transportation", false)
    way:Attribute("class", way.tags.highway)
  end
  if way.tags.building then
    way:Layer("buildings", true)
  end
end`;
        fs.writeFileSync(processPath, basicProcess);
      }
    }
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Try simple command first, then with config if that fails
    const simpleCmd = `tilemaker "${pbfPath}" --output "${outputDir}"`;
    const configCmd = `tilemaker "${pbfPath}" --output "${outputDir}" --config "${configPath}" --process "${processPath}"`;
    
    console.log('Running tilemaker (simple):', simpleCmd);
    
    exec(simpleCmd, { timeout: 300000 }, (err, stdout, stderr) => {
      if (err) {
        console.log('Simple command failed, trying with config...');
        console.log('Running tilemaker (with config):', configCmd);
        
        exec(configCmd, { timeout: 300000 }, (err2, stdout2, stderr2) => {
          if (err2) {
            console.error('Tilemaker error (both attempts):', stderr2 || err2.message);
            return res.status(500).json({ 
              error: 'tilemaker failed', 
              details: stderr2 || err2.message,
              command: configCmd,
              suggestion: 'Check that the PBF file is valid and tilemaker is properly installed'
            });
          }
          console.log('Tilemaker success (with config):', stdout2);
          res.json({ ok: true, output: stdout2, tilesPath: outputDir, method: 'config' });
        });
      } else {
        console.log('Tilemaker success (simple):', stdout);
        res.json({ ok: true, output: stdout, tilesPath: outputDir, method: 'simple' });
      }
    });
  });
});

// Direct PBF processing endpoints (no tilemaker required)

// Get PBF file metadata and processing recommendations
app.get('/api/pbf/:filename/info', (req, res) => {
  const filename = req.params.filename;
  const pbfPath = path.join(DATA_DIR, filename);
  
  if (!fs.existsSync(pbfPath)) {
    return res.status(404).json({ error: 'PBF file not found' });
  }
  
  try {
    const info = getBasicPBFInfo(pbfPath);
    res.json({ success: true, info });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to analyze PBF file', 
      details: error.message 
    });
  }
});

// Process PBF directly to GeoJSON (for smaller files)
app.post('/api/pbf/process-direct', async (req, res) => {
  const { filename, outputName } = req.body;
  
  if (!filename) {
    return res.status(400).json({ error: 'filename is required' });
  }
  
  const pbfPath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(pbfPath)) {
    return res.status(404).json({ error: 'PBF file not found' });
  }
  
  try {
    // Check file size first
    const stats = fs.statSync(pbfPath);
    const fileSizeMB = stats.size / (1024 * 1024);
    
    if (fileSizeMB > 100) {
      return res.json({
        success: false,
        error: 'File too large for direct processing',
        fileSizeMB: fileSizeMB.toFixed(2),
        recommendation: 'Use tilemaker for files larger than 100MB',
        alternative: 'Try extracting a smaller region or use tilemaker'
      });
    }
    
    const result = await pbfProcessor.processPBFToGeoJSON(
      pbfPath, 
      outputName || filename.replace('.osm.pbf', '')
    );
    
    res.json(result);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Direct PBF processing failed',
      details: error.message,
      fallback: 'Consider using tilemaker instead'
    });
  }
});

// Generate simple vector tiles from GeoJSON
app.post('/api/pbf/generate-tiles', async (req, res) => {
  const { geojsonPath, outputName, maxZoom = 14 } = req.body;
  
  if (!geojsonPath) {
    return res.status(400).json({ error: 'geojsonPath is required' });
  }
  
  try {
    const fullGeojsonPath = path.join(TILE_DIR, geojsonPath);
    const outputDir = path.join(TILE_DIR, outputName || 'generated-tiles');
    
    const result = await pbfProcessor.generateSimpleVectorTiles(
      fullGeojsonPath, 
      outputDir, 
      parseInt(maxZoom)
    );
    
    res.json(result);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Vector tile generation failed',
      details: error.message
    });
  }
});

// Browser-generated tiles endpoint
app.get('/api/browser-tiles/:name/:z/:x/:y', (req, res) => {
  const { name, z, x, y } = req.params;
  
  // In a real implementation, you'd store browser tiles on the server
  // For now, return an empty tile to prevent 404s
  // The actual tile data comes from the browser's memory/storage
  
  const emptyTile = {
    version: 2,
    name: 'osm',
    extent: 4096,
    layers: {
      osm: {
        version: 2,
        name: 'osm',
        extent: 4096,
        features: []
      }
    }
  };
  
  res.setHeader('Content-Type', 'application/x-protobuf');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json(emptyTile); // In practice, you'd return actual tile data
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      path: req.file.path
    };
    
    console.log('File uploaded:', fileInfo);
    res.json({ 
      message: 'File uploaded successfully', 
      file: fileInfo 
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// List downloaded PBF files
app.get('/api/files', (req, res) => {
  try {
    const files = fs.readdirSync(DATA_DIR)
      .filter(f => f.endsWith('.osm.pbf'))
      .map(f => {
        const stats = fs.statSync(path.join(DATA_DIR, f));
        return {
          name: f,
          size: stats.size,
          modified: stats.mtime
        };
      });
    res.json(files);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Delete a PBF file
app.delete('/api/files/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(DATA_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    fs.unlinkSync(filepath);
    console.log(`Deleted file: ${filename}`);
    res.json({ message: 'File deleted successfully', filename });
  } catch (e) {
    console.error('Delete error:', e);
    res.status(500).json({ error: 'Failed to delete file', details: e.message });
  }
});

// List generated tile directories
app.get('/api/tiles', (req, res) => {
  try {
    const tiles = fs.readdirSync(TILE_DIR)
      .filter(f => f !== '.gitkeep' && fs.statSync(path.join(TILE_DIR, f)).isDirectory())
      .map(f => {
        const tilePath = path.join(TILE_DIR, f);
        const stats = fs.statSync(tilePath);
        return {
          name: f,
          path: tilePath,
          modified: stats.mtime
        };
      });
    res.json(tiles);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list tiles' });
  }
});

// Basic routing endpoint (placeholder - would need routing engine)
app.post('/api/route', (req, res) => {
  const { start, end, mode = 'driving' } = req.body || {};
  if (!start || !end) {
    return res.status(400).json({ error: 'start and end coordinates required' });
  }
  
  // Placeholder response - in real implementation would use OSRM, GraphHopper, etc.
  res.json({
    route: {
      geometry: [[start[0], start[1]], [end[0], end[1]]], // Direct line for now
      distance: Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2)) * 111000, // Rough meters
      duration: 600, // 10 minutes placeholder
      mode
    },
    waypoints: [
      { location: start, name: 'Start' },
      { location: end, name: 'End' }
    ]
  });
});

// Address search endpoint (placeholder)
app.get('/api/geocode', (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json([]);
  
  // Placeholder geocoding - would use local address index in real implementation
  const mockResults = [
    { name: `${q} (mock result)`, lat: 55.6761, lon: 12.5683, country: 'Denmark' }
  ];
  res.json(mockResults);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

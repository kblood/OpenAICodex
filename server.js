import express from 'express';
import fetch from 'node-fetch';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const TILE_DIR = path.join(process.cwd(), 'tiles');

app.use(express.json());
app.use(express.static('public'));
app.use('/tiles', express.static(TILE_DIR));

// Ensure directories exist
for (const dir of [DATA_DIR, TILE_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Search geofabrik index for regions matching query
app.get('/api/geofabrik/search', async (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  try {
    const resp = await fetch('https://download.geofabrik.de/index-v1.json');
    const json = await resp.json();
    const matches = [];
    function recurse(node, pathArr) {
      if (node.items) {
        for (const [name, child] of Object.entries(node.items)) {
          recurse(child, pathArr.concat(name));
        }
      }
      if (node.urls && node.urls.pbf && pathArr.join(' ').toLowerCase().includes(q)) {
        matches.push({ name: pathArr.join(' / '), url: 'https://download.geofabrik.de/' + node.urls.pbf });
      }
    }
    recurse(json, []);
    res.json(matches);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Download PBF file to data directory
app.post('/api/geofabrik/download', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url required' });
  const filename = path.join(DATA_DIR, path.basename(url));
  try {
    const resp = await fetch(url);
    const fileStream = fs.createWriteStream(filename);
    await new Promise((resolve, reject) => {
      resp.body.pipe(fileStream);
      resp.body.on('error', reject);
      fileStream.on('finish', resolve);
    });
    res.json({ saved: filename });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'download failed' });
  }
});

// Process PBF file with tilemaker to generate vector tiles
app.post('/api/tilemaker/process', (req, res) => {
  const { pbf } = req.body;
  if (!pbf) return res.status(400).json({ error: 'pbf path required' });
  const cmd = `tilemaker ${pbf} --output ${TILE_DIR}`;
  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error(stderr);
      return res.status(500).json({ error: 'tilemaker failed', details: stderr });
    }
    res.json({ ok: true, output: stdout });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

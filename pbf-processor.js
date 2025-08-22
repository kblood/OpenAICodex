import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import through2 from 'through2';

// Direct PBF processing without tilemaker
export class DirectPBFProcessor {
  constructor(dataDir, tileDir) {
    this.dataDir = dataDir;
    this.tileDir = tileDir;
  }

  // Process PBF file to extract basic GeoJSON features
  async processPBFToGeoJSON(pbfPath, outputName) {
    try {
      // Import osm-pbf-parser dynamically since it might not be installed yet
      const { default: osmPbfParser } = await import('osm-pbf-parser');
      
      const outputDir = path.join(this.tileDir, outputName);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const features = {
        nodes: [],
        ways: [],
        relations: []
      };

      // Parse PBF file
      const stream = fs.createReadStream(pbfPath)
        .pipe(osmPbfParser())
        .pipe(through2.obj((item, enc, next) => {
          if (item.type === 'node' && item.tags) {
            features.nodes.push({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [item.lon, item.lat]
              },
              properties: item.tags
            });
          } else if (item.type === 'way' && item.tags) {
            // For ways, we'd need to resolve node references
            // This is a simplified version
            features.ways.push({
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: [] // Would need node resolution
              },
              properties: item.tags
            });
          }
          next();
        }));

      await pipeline(stream);

      // Save GeoJSON files
      const nodeGeoJSON = {
        type: 'FeatureCollection',
        features: features.nodes
      };

      fs.writeFileSync(
        path.join(outputDir, 'nodes.geojson'),
        JSON.stringify(nodeGeoJSON, null, 2)
      );

      return {
        success: true,
        outputDir,
        stats: {
          nodes: features.nodes.length,
          ways: features.ways.length,
          relations: features.relations.length
        }
      };

    } catch (error) {
      console.error('Direct PBF processing failed:', error);
      return {
        success: false,
        error: error.message,
        fallback: 'Consider using tilemaker or manual extraction'
      };
    }
  }

  // Alternative: Simple PBF metadata extraction without full parsing
  async extractPBFMetadata(pbfPath) {
    try {
      const stats = fs.statSync(pbfPath);
      const buffer = fs.readFileSync(pbfPath, { encoding: null });
      
      // Basic PBF header analysis
      const isValidPBF = buffer.length > 0 && buffer[0] === 0x0A;
      
      return {
        success: true,
        metadata: {
          filename: path.basename(pbfPath),
          fileSize: stats.size,
          fileSizeMB: (stats.size / (1024 * 1024)).toFixed(2),
          lastModified: stats.mtime,
          isValidPBF,
          canProcess: isValidPBF && stats.size > 0,
          recommendedApproach: stats.size > 100 * 1024 * 1024 ? 'tilemaker' : 'direct'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        metadata: null
      };
    }
  }

  // Generate simple vector tiles using geojson-vt (for smaller datasets)
  async generateSimpleVectorTiles(geojsonPath, outputDir, maxZoom = 14) {
    try {
      const { default: geojsonVt } = await import('geojson-vt');
      
      const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
      const tileIndex = geojsonVt(geojson, {
        maxZoom: maxZoom,
        tolerance: 3,
        extent: 4096,
        buffer: 64
      });

      // Generate tiles for zoom levels 0 to maxZoom
      const tilesGenerated = [];
      for (let z = 0; z <= maxZoom; z++) {
        const zDir = path.join(outputDir, z.toString());
        if (!fs.existsSync(zDir)) fs.mkdirSync(zDir, { recursive: true });

        const maxTileCoord = Math.pow(2, z);
        for (let x = 0; x < maxTileCoord; x++) {
          const xDir = path.join(zDir, x.toString());
          if (!fs.existsSync(xDir)) fs.mkdirSync(xDir, { recursive: true });

          for (let y = 0; y < maxTileCoord; y++) {
            const tile = tileIndex.getTile(z, x, y);
            if (tile && tile.features.length > 0) {
              const tilePath = path.join(xDir, `${y}.json`);
              fs.writeFileSync(tilePath, JSON.stringify(tile));
              tilesGenerated.push({ z, x, y });
            }
          }
        }
      }

      return {
        success: true,
        tilesGenerated: tilesGenerated.length,
        outputDir,
        maxZoom
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Fallback: Simple PBF info extractor that works without dependencies
export function getBasicPBFInfo(pbfPath) {
  try {
    const stats = fs.statSync(pbfPath);
    const buffer = fs.readFileSync(pbfPath, { start: 0, end: 100 });
    
    return {
      filename: path.basename(pbfPath),
      fileSize: stats.size,
      fileSizeMB: (stats.size / (1024 * 1024)).toFixed(2),
      lastModified: stats.mtime.toISOString(),
      isEmpty: stats.size === 0,
      hasValidHeader: buffer.length > 0 && buffer[0] === 0x0A,
      processingRecommendation: stats.size < 50 * 1024 * 1024 ? 'direct' : 'tilemaker'
    };
  } catch (error) {
    return {
      error: error.message,
      filename: path.basename(pbfPath)
    };
  }
}

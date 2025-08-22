# OpenMaps Setup Instructions

## Prerequisites
1. **Node.js** - Download and install from https://nodejs.org/
2. **Tilemaker** - Already downloaded as `tilemaker-windows.zip`

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Extract Tilemaker
Since PowerShell execution policy is restricted, manually extract:
1. Right-click `tilemaker-windows.zip`
2. Select "Extract All..."
3. Extract to a folder named `tilemaker` in this directory
4. Make sure `tilemaker.exe` is accessible in the `tilemaker` folder

### 3. Run the Application
```bash
node server.js
```

Then open your browser to: http://localhost:3000

## Alternative Quick Start
Double-click `run-app.bat` for guided setup.

## Application Features
- Search and download OSM data from Geofabrik
- Upload your own OSM PBF files
- **Two processing options:**
  - **Direct PBF Processing**: For smaller files (< 50MB), process directly without tilemaker
  - **Tilemaker Processing**: For larger files, use tilemaker for optimal performance
- View maps with MapLibre GL JS
- Plan routes (basic implementation)

## Processing Options

### Option 1: Direct PBF Processing (No External Dependencies)
For smaller PBF files, the app can process OSM data directly:
- **Advantages**: No need to install tilemaker, works immediately
- **Best for**: Small regions, cities, or test data (< 50MB)
- **Features**: Extracts nodes, ways, and relations to GeoJSON format
- **Limitations**: Not suitable for large datasets (countries/continents)

### Option 2: Tilemaker Processing (Recommended for Large Files)
For larger datasets, use tilemaker for optimal performance:
- **Advantages**: Handles large files efficiently, produces optimized vector tiles
- **Best for**: Countries, large regions, or production use
- **Requirements**: Tilemaker binary (provided as tilemaker-windows.zip)
- **Features**: Full vector tile generation with styling options

## Tilemaker Integration
The server automatically detects:
1. Local tilemaker in `./tilemaker/` folder
2. System-installed tilemaker in PATH
3. Provides helpful error messages if neither is found

## Troubleshooting
- If Node.js commands don't work, ensure Node.js is installed and in PATH
- **Direct processing fails**: File might be too large (>50MB) - try tilemaker instead
- **Tilemaker processing fails**: Check that tilemaker.exe is properly extracted
- **"Cannot find module" errors**: Run `npm install` to install dependencies  
- For upload issues, ensure the `data` folder exists (created automatically)
- For tile serving issues, ensure the `tiles` folder exists (created automatically)

## Processing Method Recommendations
- **Small files (< 10MB)**: Use direct processing for immediate results
- **Medium files (10-50MB)**: Either method works, direct processing is simpler
- **Large files (> 50MB)**: Use tilemaker for better performance and memory usage
- **Very large files (> 500MB)**: Tilemaker only, consider extracting smaller regions first

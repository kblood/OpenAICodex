# Freescape Game Loading

This document summarizes how the ScummVM Freescape engine identifies and loads a game database.

## Game Detection

The engine uses a static table of `ADGameDescription` structures that map known data files and MD5 hashes to specific game entries. During startup the detection code scans the user's files and matches them against this table to decide which Freescape title and platform to initialise【F:FreescapeExporter/References/detection_snippet.cpp†L1-L10】.

## Bootstrapping the Engine

Once the target game has been detected, `FreescapeEngine::run()` sets up the renderer and then loads all game data. The main bootstrap sequence calls `loadDataBundle()`, `loadAssets()`, initialises the game state, and finally loads the colour palette before entering the main loop【F:FreescapeExporter/References/freescape_snippet.cpp†L1-L7】.

## Reading the Binary Database

Game assets for 8‑bit titles are stored in a packed binary database. `load8bitBinary()` begins by reading the number of areas in the file along with the start area and other metadata. It then reads an offset table that points to each area's definition and iterates over it, invoking `load8bitArea()` for every entry【F:FreescapeExporter/References/8bitBinaryLoader_snippet.cpp†L141-L154】【F:FreescapeExporter/References/8bitBinaryLoader_snippet.cpp†L156-L168】.

## Parsing an Area

`load8bitArea()` seeks to the area's offset and extracts its header fields: flags, object count, area number, a pointer to local conditions, and the scale factor. Colour information and optional, game‑specific fields such as room names or additional colours are decoded next. The loader then reads each object record, adding entrances to a separate map while the rest populate the area's object list【F:FreescapeExporter/References/8bitBinaryLoader_snippet.cpp†L1-L140】.

## Game Differences

Many steps depend on the selected game and platform. For example, when running Castle Master on Spectrum or CPC the area header stores a single attribute byte that encodes ink and paper colours, while DOS builds store four separate colour bytes; Amiga versions add yet another set of “extra” colours【F:FreescapeExporter/References/8bitBinaryLoader_snippet.cpp†L26-L120】. Other titles like Driller or Dark Side include gas pocket data or extended countdown timers, so the loader branches accordingly when reading these additional fields.

These conditional code paths mean the loader must be aware of both the current game and target platform to correctly interpret the binary layout.

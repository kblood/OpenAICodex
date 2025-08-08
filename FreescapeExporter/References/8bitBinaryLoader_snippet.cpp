Area *FreescapeEngine::load8bitArea(Common::SeekableReadStream *file, uint16 ncolors) {

	Common::String name;
	uint32 base = file->pos();
	debugC(1, kFreescapeDebugParser, "Area base: %x", base);
	uint8 areaFlags = readField(file, 8);
	uint8 numberOfObjects = readField(file, 8);
	uint8 areaNumber = readField(file, 8);

	uint16 cPtr = readPtr(file);
	debugC(1, kFreescapeDebugParser, "Condition pointer: %x", cPtr);
	uint8 scale = readField(file, 8);
	debugC(1, kFreescapeDebugParser, "Scale: %d", scale);

	uint8 skyColor = areaFlags & 15;
	uint8 groundColor = areaFlags >> 4;

	if (groundColor == 0)
		groundColor = 255;

	uint8 usualBackgroundColor = 0;
	uint8 underFireBackgroundColor = 0;
	uint8 paperColor = 0;
	uint8 inkColor = 0;

	if (!(isCastle() && (isSpectrum() || isCPC() || isC64()))) {
		usualBackgroundColor = readField(file, 8);
		underFireBackgroundColor = readField(file, 8);
		paperColor = readField(file, 8);
		inkColor = readField(file, 8);
	} else {
		uint8 attribute = readField(file, 8);
		debugC(1, kFreescapeDebugParser, "Attribute: %x", attribute);
		if (isSpectrum()) {
			paperColor = attribute >> 4;
			inkColor = attribute & 0xf;
		} else if (isCPC()) {
			paperColor = attribute;
			inkColor = 0xb;
		}
		skyColor = 0;
	}

	debugC(1, kFreescapeDebugParser, "Colors usual background: %d", usualBackgroundColor);
	debugC(1, kFreescapeDebugParser, "Colors under fire background: %d", underFireBackgroundColor);
	debugC(1, kFreescapeDebugParser, "Color Paper: %d", paperColor);
	debugC(1, kFreescapeDebugParser, "Color Ink: %d", inkColor);
	debugC(1, kFreescapeDebugParser, "Additional colors: %d %d", skyColor, groundColor);

	debugC(1, kFreescapeDebugParser, "Area %d", areaNumber);
	debugC(1, kFreescapeDebugParser, "Flags: %d Objects: %d", areaFlags, numberOfObjects);
	// debug("Condition Ptr: %x", cPtr);
	debugC(1, kFreescapeDebugParser, "Pos before first object: %lx", long(file->pos()));

	// Driller specific
	uint8 gasPocketX = 0;
	uint8 gasPocketY = 0;
	uint8 gasPocketRadius = 0;
	// Castle specific
	uint8 extraColor[4] = {};
	if (isEclipse()) {
		byte idx = readField(file, 8);
		if (isEclipse2()) {
			name = idx < 8 ? eclipse2RoomName[idx] : eclipse2RoomName[8];
		} else
			name = idx < 8 ? eclipseRoomName[idx] : eclipseRoomName[8];

		name = name + "-" + char(readField(file, 8)) + " ";

		int i = 0;
		while (i < 3) {
			name = name + char(readField(file, 8));
			i++;
		}

		if (isAmiga() || isAtariST()) {
			groundColor = skyColor;
			skyColor = 0;
		}
	} else if (isDriller() || isDark()) {
		if (isDriller()) {
			gasPocketX = readField(file, 8);
			gasPocketY = readField(file, 8);
			gasPocketRadius = readField(file, 8);
		} else {
			name = name + char(readField(file, 8));
			name = name + char(readField(file, 8));
			name = name + char(readField(file, 8));
		}
		debugC(1, kFreescapeDebugParser, "Gas pocket at (%d, %d) with radius %d", gasPocketX, gasPocketY, gasPocketRadius);
		int i = 0;
		while (i < 12) {
			name = name + char(readField(file, 8));
			i++;
		}
	} else if (isCastle()) {
		byte idx = readField(file, 8);
		if (isAmiga())
			name = _messagesList[idx + 51];
		else if (isSpectrum() || isCPC())
			name = areaNumber == 255 ? "GLOBAL" : _messagesList[idx + 16];
		else
			name = _messagesList[idx + 41];

		if (isDOS()) {
			extraColor[0] = readField(file, 8);
			extraColor[1] = readField(file, 8);
			extraColor[2] = readField(file, 8);
			extraColor[3] = readField(file, 8);
			debugC(1, kFreescapeDebugParser, "Extra colors: %x %x %x %x", extraColor[0], extraColor[1], extraColor[2], extraColor[3]);
		}

		if (isAmiga()) {
			extraColor[0] = readField(file, 8);
			extraColor[1] = readField(file, 8);
			extraColor[2] = readField(file, 8);
			extraColor[3] = readField(file, 8);
			// TODO
			groundColor = skyColor;
			skyColor = 0;
			debugC(1, kFreescapeDebugParser, "Extra colors: %x %x %x %x", extraColor[0], extraColor[1], extraColor[2], extraColor[3]);
		}
	}
	debugC(1, kFreescapeDebugParser, "Area name: %s", name.c_str());

	ObjectMap *objectsByID = new ObjectMap;
	ObjectMap *entrancesByID = new ObjectMap;
	for (uint8 object = 0; object < numberOfObjects && areaNumber != 192; object++) {
		debugC(1, kFreescapeDebugParser, "Reading object: %d", object);
		Object *newObject = load8bitObject(file);

		if (newObject) {
			newObject->scale(scale);
			if (newObject->getType() == kEntranceType) {
				if (entrancesByID->contains(newObject->getObjectID() & 0x7fff))
					error("WARNING: replacing object id %d (%d)", newObject->getObjectID(), newObject->getObjectID() & 0x7fff);

				(*entrancesByID)[newObject->getObjectID() & 0x7fff] = newObject;
			} else {
				if (objectsByID->contains(newObject->getObjectID()))
	uint8 numberOfAreas = readField(file, 8);
	if (isAmiga() && isCastle() && isDemo())
		numberOfAreas = 87;
	debugC(1, kFreescapeDebugParser, "Number of areas: %d", numberOfAreas);

	uint32 dbSize = readField(file, 16);
	debugC(1, kFreescapeDebugParser, "Database ends at %x", dbSize);
	if (isAmiga() || isAtariST())
		debugC(1, kFreescapeDebugParser, "Extra field: %x", readField(file, 16));

	uint8 startArea = readField(file, 8);
	debugC(1, kFreescapeDebugParser, "Start area: %d", startArea);
	uint8 startEntrance = readField(file, 8);
	debugC(1, kFreescapeDebugParser, "Entrace area: %d", startEntrance);
	debugC(1, kFreescapeDebugParser, "areas index at: %lx", long(file->pos()));
	uint16 *fileOffsetForArea = new uint16[numberOfAreas];
	for (uint16 area = 0; area < numberOfAreas; area++) {
		fileOffsetForArea[area] = readPtr(file);
		debugC(1, kFreescapeDebugParser, "offset: %x", fileOffsetForArea[area]);
	}

	// grab the areas
	Area *newArea = nullptr;
	for (uint16 area = 0; area < numberOfAreas; area++) {
		debugC(1, kFreescapeDebugParser, "Starting to parse area index %d at offset %x", area, fileOffsetForArea[area]);

		file->seek(offset + fileOffsetForArea[area]);
		newArea = load8bitArea(file, ncolors);

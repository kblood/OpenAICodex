using System.Collections.Generic;
using System.IO;
using System.Numerics;

namespace FreescapeExporter;

public static class FreescapeLoader
{
    public static List<FreescapeArea> LoadAreas(Stream stream, GameType game)
    {
        var areas = new List<FreescapeArea>();
        using var reader = new BinaryReader(stream);

        if (reader.BaseStream.Length < 1)
            return areas;

        byte areaCount = reader.ReadByte();

        if (reader.BaseStream.Length - reader.BaseStream.Position < 2)
            return areas;

        ushort dbEnd = reader.ReadUInt16();

        // Some versions include an extra field before the start area. If there
        // is enough data, consume it heuristically.
        if (reader.BaseStream.Length - reader.BaseStream.Position >= 3 + areaCount * 2)
            reader.ReadUInt16();

        if (reader.BaseStream.Length - reader.BaseStream.Position < 1)
            return areas;

        byte startArea = reader.ReadByte();

        var offsets = new ushort[areaCount];
        for (int i = 0; i < areaCount && reader.BaseStream.Position + 1 < reader.BaseStream.Length; i++)
        {
            offsets[i] = reader.ReadUInt16();
        }

        long baseOffset = 0; // assume stream starts at database

        foreach (var off in offsets)
        {
            if (off == 0)
                continue;

            if (baseOffset + off >= reader.BaseStream.Length)
                continue;

            reader.BaseStream.Seek(baseOffset + off, SeekOrigin.Begin);

            if (reader.BaseStream.Length - reader.BaseStream.Position < 6)
                break;

            byte areaFlags = reader.ReadByte();
            byte objectCount = reader.ReadByte();
            byte areaId = reader.ReadByte();
            reader.ReadUInt16(); // condition pointer
            byte scale = reader.ReadByte();

            var area = new FreescapeArea { Id = areaId, Scale = scale };

            for (int o = 0; o < objectCount; o++)
            {
                if (reader.BaseStream.Length - reader.BaseStream.Position < 9)
                    break;

                byte rawFlagsAndType = reader.ReadByte();
                var type = (ObjectType)(rawFlagsAndType & 0x1F);

                var position = new Vector3(reader.ReadByte(), reader.ReadByte(), reader.ReadByte()) * 32f;
                var size = new Vector3(reader.ReadByte(), reader.ReadByte(), reader.ReadByte()) * 32f;
                byte objectId = reader.ReadByte();
                byte objectSize = reader.ReadByte();

                int remaining = objectSize - 9;
                if (remaining < 0 || remaining > reader.BaseStream.Length - reader.BaseStream.Position)
                    break;

                reader.ReadBytes(remaining);

                var obj = new GeometricObject
                {
                    Type = type,
                    Id = objectId,
                    Origin = position,
                    Size = size
                };

                if (type == ObjectType.Entrance)
                    area.Entrances.Add(obj);
                else
                    area.Objects.Add(obj);
            }

            areas.Add(area);
        }

        return areas;
    }
}

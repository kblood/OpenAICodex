using System;
using System.Globalization;
using System.IO;
using System.Numerics;

namespace FreescapeExporter;

public static class ObjExporter
{
    public static void ExportArea(FreescapeArea area, string path)
    {
        using var writer = new StreamWriter(path);
        writer.WriteLine(string.Create(CultureInfo.InvariantCulture, $"# Exported area {area.Id}"));
        int vertexOffset = 1;
        foreach (var obj in area.Objects)
        {
            WriteObject(obj, writer, ref vertexOffset);
        }
    }

    private static void WriteObject(GeometricObject obj, StreamWriter writer, ref int vertexOffset)
    {
        switch (obj.Type)
        {
            case ObjectType.Cube:
            case ObjectType.Rectangle:
                WriteBox(obj, writer, ref vertexOffset);
                break;
            case ObjectType.EastPyramid:
            case ObjectType.WestPyramid:
            case ObjectType.UpPyramid:
            case ObjectType.DownPyramid:
            case ObjectType.NorthPyramid:
            case ObjectType.SouthPyramid:
                WritePyramid(obj, writer, ref vertexOffset);
                break;
            case ObjectType.Line:
                WriteLine(obj, writer, ref vertexOffset);
                break;
            case ObjectType.Triangle:
            case ObjectType.Quadrilateral:
            case ObjectType.Pentagon:
            case ObjectType.Hexagon:
                int sides = obj.Type switch
                {
                    ObjectType.Triangle => 3,
                    ObjectType.Quadrilateral => 4,
                    ObjectType.Pentagon => 5,
                    ObjectType.Hexagon => 6,
                    _ => 3
                };
                WritePrism(obj, sides, writer, ref vertexOffset);
                break;
            default:
                // Entrance, Sensor, Group and other non-geometric objects are ignored
                break;
        }
    }

    private static void WriteBox(GeometricObject obj, StreamWriter writer, ref int vertexOffset)
    {
        Vector3 o = obj.Origin;
        Vector3 s = obj.Size;
        Vector3[] v = new Vector3[8];
        v[0] = new Vector3(o.X, o.Y, o.Z);
        v[1] = new Vector3(o.X + s.X, o.Y, o.Z);
        v[2] = new Vector3(o.X + s.X, o.Y + s.Y, o.Z);
        v[3] = new Vector3(o.X, o.Y + s.Y, o.Z);
        v[4] = new Vector3(o.X, o.Y, o.Z + s.Z);
        v[5] = new Vector3(o.X + s.X, o.Y, o.Z + s.Z);
        v[6] = new Vector3(o.X + s.X, o.Y + s.Y, o.Z + s.Z);
        v[7] = new Vector3(o.X, o.Y + s.Y, o.Z + s.Z);

        foreach (var vert in v)
            writer.WriteLine(string.Create(CultureInfo.InvariantCulture, $"v {vert.X} {vert.Y} {vert.Z}"));

        writer.WriteLine($"f {vertexOffset} {vertexOffset + 1} {vertexOffset + 2} {vertexOffset + 3}");
        writer.WriteLine($"f {vertexOffset + 4} {vertexOffset + 5} {vertexOffset + 6} {vertexOffset + 7}");
        writer.WriteLine($"f {vertexOffset} {vertexOffset + 1} {vertexOffset + 5} {vertexOffset + 4}");
        writer.WriteLine($"f {vertexOffset + 1} {vertexOffset + 2} {vertexOffset + 6} {vertexOffset + 5}");
        writer.WriteLine($"f {vertexOffset + 2} {vertexOffset + 3} {vertexOffset + 7} {vertexOffset + 6}");
        writer.WriteLine($"f {vertexOffset + 3} {vertexOffset} {vertexOffset + 4} {vertexOffset + 7}");

        vertexOffset += 8;
    }

    private static void WritePyramid(GeometricObject obj, StreamWriter writer, ref int vertexOffset)
    {
        Vector3 o = obj.Origin;
        Vector3 s = obj.Size;
        Vector3[] v = new Vector3[5];
        switch (obj.Type)
        {
            case ObjectType.UpPyramid:
                v[0] = new Vector3(o.X, o.Y, o.Z);
                v[1] = new Vector3(o.X + s.X, o.Y, o.Z);
                v[2] = new Vector3(o.X + s.X, o.Y, o.Z + s.Z);
                v[3] = new Vector3(o.X, o.Y, o.Z + s.Z);
                v[4] = new Vector3(o.X + s.X / 2, o.Y + s.Y, o.Z + s.Z / 2);
                break;
            case ObjectType.DownPyramid:
                v[0] = new Vector3(o.X, o.Y + s.Y, o.Z);
                v[1] = new Vector3(o.X + s.X, o.Y + s.Y, o.Z);
                v[2] = new Vector3(o.X + s.X, o.Y + s.Y, o.Z + s.Z);
                v[3] = new Vector3(o.X, o.Y + s.Y, o.Z + s.Z);
                v[4] = new Vector3(o.X + s.X / 2, o.Y, o.Z + s.Z / 2);
                break;
            case ObjectType.EastPyramid:
                v[0] = new Vector3(o.X, o.Y, o.Z);
                v[1] = new Vector3(o.X, o.Y + s.Y, o.Z);
                v[2] = new Vector3(o.X, o.Y + s.Y, o.Z + s.Z);
                v[3] = new Vector3(o.X, o.Y, o.Z + s.Z);
                v[4] = new Vector3(o.X + s.X, o.Y + s.Y / 2, o.Z + s.Z / 2);
                break;
            case ObjectType.WestPyramid:
                v[0] = new Vector3(o.X + s.X, o.Y, o.Z);
                v[1] = new Vector3(o.X + s.X, o.Y + s.Y, o.Z);
                v[2] = new Vector3(o.X + s.X, o.Y + s.Y, o.Z + s.Z);
                v[3] = new Vector3(o.X + s.X, o.Y, o.Z + s.Z);
                v[4] = new Vector3(o.X, o.Y + s.Y / 2, o.Z + s.Z / 2);
                break;
            case ObjectType.NorthPyramid:
                v[0] = new Vector3(o.X, o.Y, o.Z);
                v[1] = new Vector3(o.X + s.X, o.Y, o.Z);
                v[2] = new Vector3(o.X + s.X, o.Y + s.Y, o.Z);
                v[3] = new Vector3(o.X, o.Y + s.Y, o.Z);
                v[4] = new Vector3(o.X + s.X / 2, o.Y + s.Y / 2, o.Z + s.Z);
                break;
            case ObjectType.SouthPyramid:
                v[0] = new Vector3(o.X, o.Y, o.Z + s.Z);
                v[1] = new Vector3(o.X + s.X, o.Y, o.Z + s.Z);
                v[2] = new Vector3(o.X + s.X, o.Y + s.Y, o.Z + s.Z);
                v[3] = new Vector3(o.X, o.Y + s.Y, o.Z + s.Z);
                v[4] = new Vector3(o.X + s.X / 2, o.Y + s.Y / 2, o.Z);
                break;
        }

        foreach (var vert in v)
            writer.WriteLine(string.Create(CultureInfo.InvariantCulture, $"v {vert.X} {vert.Y} {vert.Z}"));

        writer.WriteLine($"f {vertexOffset} {vertexOffset + 1} {vertexOffset + 2} {vertexOffset + 3}");
        writer.WriteLine($"f {vertexOffset} {vertexOffset + 1} {vertexOffset + 4}");
        writer.WriteLine($"f {vertexOffset + 1} {vertexOffset + 2} {vertexOffset + 4}");
        writer.WriteLine($"f {vertexOffset + 2} {vertexOffset + 3} {vertexOffset + 4}");
        writer.WriteLine($"f {vertexOffset + 3} {vertexOffset} {vertexOffset + 4}");

        vertexOffset += 5;
    }

    private static void WriteLine(GeometricObject obj, StreamWriter writer, ref int vertexOffset)
    {
        Vector3 o = obj.Origin;
        Vector3 end = obj.Origin + obj.Size;
        writer.WriteLine(string.Create(CultureInfo.InvariantCulture, $"v {o.X} {o.Y} {o.Z}"));
        writer.WriteLine(string.Create(CultureInfo.InvariantCulture, $"v {end.X} {end.Y} {end.Z}"));
        writer.WriteLine($"l {vertexOffset} {vertexOffset + 1}");
        vertexOffset += 2;
    }

    private static void WritePrism(GeometricObject obj, int sides, StreamWriter writer, ref int vertexOffset)
    {
        Vector3 o = obj.Origin;
        Vector3 s = obj.Size;
        float radiusX = s.X / 2f;
        float radiusZ = s.Z / 2f;
        float centerX = o.X + radiusX;
        float centerZ = o.Z + radiusZ;
        float y0 = o.Y;
        float y1 = o.Y + s.Y;

        for (int i = 0; i < sides; i++)
        {
            float angle = (float)(i * 2 * Math.PI / sides);
            float x = centerX + radiusX * MathF.Cos(angle);
            float z = centerZ + radiusZ * MathF.Sin(angle);
            writer.WriteLine(string.Create(CultureInfo.InvariantCulture, $"v {x} {y0} {z}"));
        }
        for (int i = 0; i < sides; i++)
        {
            float angle = (float)(i * 2 * Math.PI / sides);
            float x = centerX + radiusX * MathF.Cos(angle);
            float z = centerZ + radiusZ * MathF.Sin(angle);
            writer.WriteLine(string.Create(CultureInfo.InvariantCulture, $"v {x} {y1} {z}"));
        }

        writer.Write("f");
        for (int i = 0; i < sides; i++)
            writer.Write(string.Create(CultureInfo.InvariantCulture, $" {vertexOffset + i}"));
        writer.WriteLine();
        writer.Write("f");
        for (int i = 0; i < sides; i++)
            writer.Write(string.Create(CultureInfo.InvariantCulture, $" {vertexOffset + sides + i}"));
        writer.WriteLine();
        for (int i = 0; i < sides; i++)
        {
            int next = (i + 1) % sides;
            writer.WriteLine($"f {vertexOffset + i} {vertexOffset + next} {vertexOffset + sides + next} {vertexOffset + sides + i}");
        }

        vertexOffset += sides * 2;
    }
}

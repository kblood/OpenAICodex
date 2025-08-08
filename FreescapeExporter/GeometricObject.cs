using System.Numerics;

namespace FreescapeExporter;

public enum ObjectType
{
    Entrance = 0,
    Cube = 1,
    Sensor = 2,
    Rectangle = 3,
    EastPyramid = 4,
    WestPyramid = 5,
    UpPyramid = 6,
    DownPyramid = 7,
    NorthPyramid = 8,
    SouthPyramid = 9,
    Line = 10,
    Triangle = 11,
    Quadrilateral = 12,
    Pentagon = 13,
    Hexagon = 14,
    Group = 15
}

public class GeometricObject
{
    public ObjectType Type { get; init; }
    public byte Id { get; init; }
    public Vector3 Origin { get; init; }
    public Vector3 Size { get; init; }
}

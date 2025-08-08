using System.Collections.Generic;

namespace FreescapeExporter;

public class FreescapeArea
{
    public byte Id { get; init; }
    public byte Scale { get; init; }
    public List<GeometricObject> Objects { get; } = new();
    public List<GeometricObject> Entrances { get; } = new();
}

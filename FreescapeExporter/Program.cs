using FreescapeExporter;

if (args.Length < 2)
{
    Console.WriteLine("Usage: FreescapeExporter <input.bin> <output_directory>");
    return;
}

var inputPath = args[0];
var outputDir = args[1];
Directory.CreateDirectory(outputDir);

using var fs = File.OpenRead(inputPath);
var areas = FreescapeLoader.LoadAreas(fs, GameType.CastleMaster);

foreach (var area in areas)
{
    var outPath = Path.Combine(outputDir, $"area_{area.Id}.obj");
    ObjExporter.ExportArea(area, outPath);
    Console.WriteLine($"Exported {area.Objects.Count} objects to {outPath}");
}

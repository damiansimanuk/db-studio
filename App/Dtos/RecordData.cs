namespace DbStudio.Dtos;

public class RecordData
{
    public int TableId { get; set; }
    public string? ParentColumn { get; set; }
    public Dictionary<string, object> Columns { get; set; } = new();
    public List<RecordData> Dependencies { get; set; } = new();
}


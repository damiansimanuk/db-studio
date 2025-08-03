namespace DbStudio.Dtos;

public record RecordData
{
    public bool IsEdition { get; set; }
    public string Schema { get; set; } = string.Empty;
    public string Table { get; set; } = string.Empty;
    public string? ParentColumn { get; set; }
    public Dictionary<string, string?> Columns { get; set; } = new();
    public List<RecordData> Dependencies { get; set; } = new();
}


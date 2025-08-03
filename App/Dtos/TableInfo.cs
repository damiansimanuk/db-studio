namespace DbStudio.Dtos;

public class TableInfo
{ 
    public string Schema { get; set; } = string.Empty;
    public string Table { get; set; } = string.Empty;
    public bool IsEntity { get; set; }
    public bool IsExtension { get; set; }
    public string? IdentityColumn { get; set; }
    public string[] RepresentationColumns { get; set; }
    public List<ColumnInfoRecord> Columns { get; set; }
}

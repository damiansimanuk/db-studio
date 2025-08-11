namespace DbStudio.Dtos;

public class TableInfoDto
{
    public string Schema { get; set; } = string.Empty;
    public string Table { get; set; } = string.Empty;
    //public bool IsEntity { get; set; }
    public bool IsExtension { get; set; }
    public string? IdentityColumn { get; set; }
    public List<string> IdentifierColumns { get; set; } = new();
    public List<string> UpdateableColumns { get; set; } = new();
    public List<string> InsertableColumns { get; set; } = new();
    public List<ColumnInfoDto> Columns { get; set; } = new();
}

namespace DbStudio.Dtos;

public class CustomColumnInfo
{ 
    public string? ConnectionName { get; set; }
    public string? Schema { get; set; }
    public string? Table { get; set; } 
    public string? ColumnName { get; set; }
    public string? DataType { get; set; }
    public string? DbType { get; set; }
    public string? DefaultValue { get; set; }
    public bool? IsNullable { get; set; }
    public bool? IsIdentity { get; set; }
    public bool? IsPK { get; set; }
    public bool? IsFK { get; set; }
    public bool? IsUK { get; set; }
    public bool? IsExtension { get; set; }
    public string? SchemaFK { get; set; }
    public string? TableFK { get; set; }
}


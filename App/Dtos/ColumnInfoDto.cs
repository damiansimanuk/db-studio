namespace DbStudio.Dtos;

public class ColumnInfoDto
{
    internal int TableId { get; set; }
    public string Schema { get; set; } = string.Empty;
    public string Table { get; set; } = string.Empty;
    public int ColumnId { get; set; }
    public string ColumnName { get; set; } = string.Empty;
    public DataTypeEnum DataType { get; set; } = DataTypeEnum.String;
    public string? DbType { get; set; }
    public string DefaultValue { get; set; } = string.Empty;
    public bool IsNullable { get; set; }
    public bool IsIdentity { get; set; }
    public bool IsPK { get; set; }
    public bool IsFK { get; set; }
    public bool IsUK { get; set; }
    public bool IsExtension { get; set; }
    public bool IsCustom { get; set; }
    public string SchemaFK { get; set; } = string.Empty;
    public string TableFK { get; set; } = string.Empty;
}

namespace DbStudio.Dtos;

public record ItemDataDto
{
    public bool IsEdition { get; set; }
    public string Schema { get; set; } = string.Empty;
    public string Table { get; set; } = string.Empty;
    public string? ParentColumn { get; set; }
    public Dictionary<string, string?> Columns { get; set; } = new();
    public List<ItemDataDto> Dependencies { get; set; } = new();
    internal ItemDataDto? GetDependency(string fkColumn, string identityColumn, string identityValue)
    {
        return Dependencies.FirstOrDefault(d =>
        {
            if (d.ParentColumn != fkColumn)
                return false;

            var val = d.Columns.GetValueOrDefault(identityColumn);
            return (identityValue is null && val is null) || val == identityValue;
        });
    }
}


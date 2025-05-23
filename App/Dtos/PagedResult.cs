namespace DbStudio.Models;

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PerPage { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PerPage);
}

public class RowColumns 
{
    public List<Dictionary<string, object>> Columns { get; set; } = new();
}

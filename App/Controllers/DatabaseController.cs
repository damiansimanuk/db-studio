using DbStudio.Dtos;
using DbStudio.Models;
using DbStudio.Services;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class DatabaseController : ControllerBase
{
    private readonly DatabaseService _databaseService;

    public DatabaseController(DatabaseService databaseService)
    {
        _databaseService = databaseService;
    }

    [HttpGet("structure")]
    public async Task<ActionResult<List<TableInfo>>> GetDatabaseStructure(
        string connectionName = "DefaultConnection")
    {
        var structure = _databaseService.GetDatabaseStructure(connectionName);
        return structure;
    }

    [HttpGet("tableStructure")]
    public ActionResult<TableInfo?> GetTableInfo(
        string connectionName,
        string schema,
        string table)
    {
        return _databaseService.GetTableInfo(connectionName, schema, table);
    }

    [HttpPost("GetMergeSql")]
    public ActionResult<string> GetMergeSql(
        string connectionName = "DefaultConnection",
        [FromBody] RecordData recordData = null!)
    {
        var mergeSql = _databaseService.GetMergeSql(connectionName, recordData);
        return mergeSql;
    }

    [HttpGet("tablePaginationRecords")]
    public Task<PagedResult<IDictionary<string, object>>> GetTableRows(
        string connectionName = "DefaultConnection",
        string schema = "Config",
        string table = "Config",
        int page = 1,
        int perPage = 100)
    {
        return _databaseService.GetTableRows(connectionName, schema, table, page, perPage);
    }

    [HttpGet("tableRecord")]
    public Task<IDictionary<string, object>> GetRecord(
        string connectionName,
        string schema,
        string table,
        string recordId)
    {
        return _databaseService.GetRecord(connectionName, schema, table, recordId);
    }

    [HttpPost("connection/{connectionName}")]
    public Task DefineConnection(
        string connectionName,
        [FromBody] string connectionString)
    {
        return _databaseService.DefineConnection(connectionName, connectionString);
    }

    [HttpGet("connections")]
    public Task<List<ConnectionRecord>> GetConnections()
    {
        return _databaseService.GetConnections();
    }

    [HttpPut("columnConfig/{connectionName}")]
    public Task DefineColumnConfig(
        string connectionName,
        [FromBody] CustomColumnInfo[] customColumnConfig)
    {
        return _databaseService.DefineColumnConfig(connectionName, customColumnConfig);
    }
}

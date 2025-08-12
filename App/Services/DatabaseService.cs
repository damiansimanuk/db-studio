using Dapper;
using DbStudio.Database;
using DbStudio.Dtos;
using DbStudio.Models;
using DiffPlex;
using DiffPlex.DiffBuilder;
using DiffPlex.DiffBuilder.Model;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.Data.SqlClient;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace DbStudio.Services;

public class DatabaseService
{
    private readonly ConcurrentDictionary<string, DatabaseContextinstance> _databaseStructure;
    private readonly List<ConnectionDto> _connections;
    private readonly ConfigDatabase _configDatabase;

    public DatabaseService(IConfiguration configuration)
    {
        _databaseStructure = new ConcurrentDictionary<string, DatabaseContextinstance>();
        _configDatabase = new ConfigDatabase();
        _configDatabase.InitCustomColumnConfigs().Wait();

        _configDatabase.DefineConnection("Rigel", configuration.GetConnectionString("Rigel")!).Wait();
        _configDatabase.DefineConnection("Atlasbooks", configuration.GetConnectionString("Atlasbooks")!).Wait();
        _configDatabase.DefineConnection("TNAF4PRDDB", configuration.GetConnectionString("TNAF4PRDDB")!).Wait();
        _connections = GetConnections().Result;
    }

    private DatabaseContextinstance GetProcessor(
        string connectionName)
    {
        var connectionString = _connections.FirstOrDefault(c => c.ConnectionName == connectionName)?.ConnectionString
            ?? throw new Exception("Connection not found");

        return _databaseStructure.GetOrAdd(connectionName, cn => new DatabaseContextinstance(_configDatabase, cn, connectionString));
    }

    public TableInfoDto? GetTableInfo(
        string connectionName,
        string schema,
        string table)
    {
        return GetProcessor(connectionName).GetTableInfo(schema, table);
    }

    public List<TableInfoDto> GetDatabaseStructure(string connectionName)
    {
        return GetProcessor(connectionName).GetDatabaseStructure();
    }

    public (string originalSql, string newSql, string diffSql) GetMergeSql(
        string connectionName,
        ItemDataDto recordData)
    {
        var processor = GetProcessor(connectionName);

        var originalSqlList = new List<string>();
        var originalData = processor.LoadDependencies(recordData, null, true);
        if (originalData != null)
        {
            processor.LoadMergeSql(originalData, originalSqlList);
        }

        var recordWithDeps = processor.LoadDependencies(recordData, null, false) ?? recordData;

        var newSqlList = new List<string>();
        processor.LoadMergeSql(recordWithDeps, newSqlList);
        var originalSql = string.Join("\n\n", originalSqlList);
        var newSql = string.Join("\n\n", newSqlList);
        var diff = "";

        if (originalSql.Trim() != newSql.Trim())
        {
            diff = GenerateDiff(originalSql, newSql);
        }

        return (originalSql, newSql, diff);
    }

    private string GenerateDiff(string original, string modified)
    {
        var diffBuilder = new InlineDiffBuilder(new Differ());
        var diff = diffBuilder.BuildDiffModel(original, modified);

        var result = new StringBuilder();
        foreach (var line in diff.Lines)
        {
            switch (line.Type)
            {
                case ChangeType.Inserted:
                    result.AppendLine($"+ {line.Text}");
                    break;
                case ChangeType.Deleted:
                    result.AppendLine($"- {line.Text}");
                    break;
                default:
                    result.AppendLine($"  {line.Text}");
                    break;
            }
        }
        return result.ToString();
    }

    public Task<PagedResult<Dictionary<string, string?>>> GetTableRows(
        string connectionName,
        string schema,
        string table,
        int page = 1,
        int perPage = 100)
    {
        return GetProcessor(connectionName).GetTableRows(schema, table, page, perPage);
    }

    public Dictionary<string, string?>? GetRecord(
        string connectionName,
        string schema,
        string table,
        string recordId)
    {
        return GetProcessor(connectionName).GetRecord(schema, table, recordId);
    }

    public async Task DefineColumnConfig(
        string connectionName,
        CustomColumnInfoDto[] customColumnConfig)
    {
        await _configDatabase.DefineColumnConfig(connectionName, customColumnConfig);
        _databaseStructure.TryRemove(connectionName, out _);
    }

    public async Task DefineConnection(string connectionName, string connectionString)
    {
        await _configDatabase.DefineConnection(connectionName, connectionString);
        _databaseStructure.TryRemove(connectionName, out _);
    }

    public Task<List<ConnectionDto>> GetConnections()
    {
        return _configDatabase.GetConnections();
    }
}

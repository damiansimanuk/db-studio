using Dapper;
using DbStudio.Dtos;
using DbStudio.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.Data.SqlClient;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;

namespace DbStudio.Services;

public class DatabaseService
{
    private readonly ConcurrentDictionary<string, DatabaseContextinstance> _databaseStructure;
    private readonly List<ConnectionRecord> _connections;

    public DatabaseService(IConfiguration configuration)
    {
        _databaseStructure = new ConcurrentDictionary<string, DatabaseContextinstance>();
        ApiRepository.InitCustomColumnConfigs().Wait();

        ApiRepository.DefineConnection("Rigel", configuration.GetConnectionString("Rigel")).Wait();
        ApiRepository.DefineConnection("Atlasbooks", configuration.GetConnectionString("Atlasbooks")).Wait();
        ApiRepository.DefineConnection("TNAF4PRDDB", configuration.GetConnectionString("TNAF4PRDDB")).Wait();
        _connections = ApiRepository.GetConnections().Result;
    }

    private DatabaseContextinstance GetProcessor(
        string connectionName)
    {
        return _databaseStructure.GetOrAdd(connectionName, cn => new DatabaseContextinstance(cn, _connections.FirstOrDefault(c => c.ConnectionName == cn)?.ConnectionString ?? throw new Exception("Connection not found")));
    }

    public TableInfo? GetTableInfo(
        string connectionName,
        string schema,
        string table)
    {
        return GetProcessor(connectionName).GetTableInfo(schema, table);
    }

    public List<TableInfo> GetDatabaseStructure(string connectionName)
    {
        return GetProcessor(connectionName).GetDatabaseStructure();
    }

    public string GetMergeSql(
        string connectionName,
        RecordData recordData)
    {
        var processor = GetProcessor(connectionName);

        var originalSql = new List<string>();
        var originalData = processor.GetOriginalData(recordData);
        if (originalData != null)
        {
            processor.GetMergeSql(originalData, originalSql);
        }

        var newSql = new List<string>();
        processor.GetMergeSql(recordData, newSql);

        return string.Join("\n\n", originalSql) + "\n\n\n\n" + string.Join("\n\n", newSql);
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
        CustomColumnInfo[] customColumnConfig)
    {
        await ApiRepository.DefineColumnConfig(connectionName, customColumnConfig);
        _databaseStructure.TryRemove(connectionName, out _);
    }

    public Task<List<ConnectionRecord>> GetConnections()
    {
        return ApiRepository.GetConnections();
    }

    public Task DefineConnection(string connectionName, string connectionString)
    {
        return ApiRepository.DefineConnection(connectionName, connectionString);
    }
}

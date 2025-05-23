using DbStudio.Dtos;
using DbStudio.Models;
using Microsoft.Extensions.Configuration;
using System.Data;
using System.Linq;

namespace DbStudio.Services;

public class DatabaseContextinstance
{

    private readonly string _connectionString;
    private Lazy<List<TableInfo>> tableInfosLazy;
    private readonly string _connectionName;

    public DatabaseContextinstance(string connectionName, string connectionString)
    {
        _connectionName = connectionName;
        _connectionString = connectionString;
        tableInfosLazy = new Lazy<List<TableInfo>>(() => ApiRepository.GetDatabaseStructure(connectionName, connectionString).Result);
    }

    public TableInfo GetTableInfo(int tableId)
    {
        return tableInfosLazy.Value.FirstOrDefault(t => t.TableId == tableId)
            ?? throw new Exception("Table not found");
    }

    public TableInfo GetTableInfo(string schema, string table)
    {
        return tableInfosLazy.Value.FirstOrDefault(t => t.Schema == schema && t.Table == table)
            ?? throw new Exception("Table not found");
    }

    public List<TableInfo> GetDatabaseStructure()
    {
        return tableInfosLazy.Value;
    }

    public string GetAssignationValueSql(ColumnInfo column, string? value, string? prefix = null, bool isCondition = false)
    {
        var valueSql = Utils.GetValueSql(column, value);
        var condition = isCondition && valueSql == "NULL" ? "IS" : "=";
        return $"{prefix ?? ""}{column.ColumnName} {condition} {valueSql}";
    }

    public List<string> GetAssignationValueSql(List<ColumnInfo> columns, RecordData recordData, string? prefix = null, bool isCondition = false)
    {
        return columns
            .Select(c => new
            {
                Column = c,
                Value = recordData.Columns.GetValueOrDefault(c.ColumnName),
                Dep = recordData.Dependencies.FirstOrDefault(d => d.ParentColumn == c.ColumnName),
            })
            .Select(c => GetAssignationValueSql(c.Column, c.Column.IsFK && c.Dep != null
                ? $"({SelectIdentity(c.Dep)})"
                : c.Value?.ToString(), prefix, isCondition))
            .ToList();
    }

    public string InsertColumnSql(List<ColumnInfo> columns)
    {
        return string.Join(", ", columns.Select(c => $"{c.ColumnName}"));
    }

    public string InsertValueSql(List<ColumnInfo> columns)
    {
        return string.Join(", ", columns.Select(c => $"{c.ColumnName}"));
    }

    public string SelectIdentity(RecordData recordData)
    {
        var tableInfo = GetTableInfo(recordData.TableId);
        var identityColumn = Utils.GetIdentityColumn(tableInfo)?.ColumnName;
        var identifierColumns = tableInfo.Columns.Where(c => (c.IsPK && !c.IsIdentity) || c.IsUK).ToList();
        var conditionColumns = GetAssignationValueSql(identifierColumns, recordData, null, true);

        var sql = $"""
        SELECT {identityColumn} FROM [{tableInfo.Schema}].[{tableInfo.Table}] WHERE {string.Join(" AND ", conditionColumns)}
        """;

        return sql;
    }

    public void GetMergeSql(RecordData recordData, List<string> sqls)
    {
        var tableInfo = GetTableInfo(recordData.TableId);
        var selectColumnsSql = GetAssignationValueSql(tableInfo.Columns, recordData);
        var ukColumns = Utils.GetUniqueKeysColumns(tableInfo);
        var updatableColumns = Utils.GetUpdateableColumns(tableInfo);
        var insertableColumns = Utils.GetInsertableColumns(tableInfo);

        recordData.Dependencies.ForEach(d => GetMergeSql(d, sqls));

        var sql = $""" 
        MERGE INTO [{tableInfo.Schema}].[{tableInfo.Table}] AS T 
        USING (SELECT
        {"\t" + string.Join(",\n\t", selectColumnsSql)}
        ) AS S 
        ON {string.Join(" AND ", ukColumns.Select(c => $"T.{c.ColumnName} = S.{c.ColumnName}"))}
        WHEN MATCHED THEN UPDATE SET {string.Join(", ", updatableColumns.Select(c => $"T.{c.ColumnName} = S.{c.ColumnName}"))}
        WHEN NOT MATCHED THEN INSERT ({string.Join(", ", insertableColumns.Select(c => c.ColumnName))})
        VALUES ({string.Join(", ", insertableColumns.Select(c => $"S.{c.ColumnName}"))})
        ;
        """;

        sqls.Add(sql);
    }

    public async Task<PagedResult<IDictionary<string, object>>> GetTableRows(
        string schema,
        string table,
        int page = 1,
        int perPage = 100)
    {
        var tableInfo = GetTableInfo(schema, table);
        var identityColumn = Utils.GetIdentityColumn(tableInfo);
        var representationColumns = Utils.GetRepresentationColumns(tableInfo);

        return await ApiRepository.GetTableRows(_connectionString, schema, table, identityColumn?.ColumnName, representationColumns, page, perPage);
    }

    public Task<IDictionary<string, object>> GetRecord(string schema, string table, string recordId)
    {
        var tableInfo = GetTableInfo(schema, table);
        var identityColumn = Utils.GetIdentityColumn(tableInfo) ?? throw new Exception("Identity column not found");
        if (string.IsNullOrWhiteSpace(recordId)) throw new Exception("Invalid recordId");

        return ApiRepository.GetRecord(_connectionString, schema, table, identityColumn.ColumnName, recordId);
    }
}

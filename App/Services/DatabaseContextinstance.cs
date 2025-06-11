using DbStudio.Dtos;
using DbStudio.Models;
using Microsoft.Extensions.Configuration;
using System.Data;
using System.Linq;

namespace DbStudio.Services;

public class DatabaseContextinstance
{
    const string prefixCN = "[";
    const string sufixCN = "]";
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
        return $"{prefix ?? ""}{prefixCN}{column.ColumnName}{sufixCN} {condition} {valueSql}";
    }

    public List<string> GetAssignationValueSql(List<ColumnInfo> columns, RecordData recordData, string? prefix = null, bool isCondition = false)
    {
        return columns
            .Select(c =>
            {
                var rowValue = recordData.Columns.GetValueOrDefault(c.ColumnName);
                var Dep = recordData.Dependencies.FirstOrDefault(d => d.ParentColumn == c.ColumnName);
                var represetnationValue = c.IsFK && Dep != null ? $"({SelectIdentity(Dep)})" : rowValue?.ToString();

                return GetAssignationValueSql(c, represetnationValue, prefix, isCondition);
            }).ToList();
    }

    public string SelectIdentity(RecordData recordData)
    {
        var tableInfo = GetTableInfo(recordData.TableId);
        var identityColumn = Utils.GetIdentityColumn(tableInfo)?.ColumnName;
        //var identifierColumns = tableInfo.Columns.Where(c => (c.IsPK && !c.IsIdentity) || c.IsUK).ToList();
        var identifierColumns = Utils.GetIdentifierColumns(tableInfo);
        var conditionColumns = GetAssignationValueSql(identifierColumns, recordData, null, true);

        var sql = $"""
        SELECT {identityColumn} FROM [{tableInfo.Schema}].[{tableInfo.Table}] WHERE {string.Join(" AND ", conditionColumns)}
        """;

        return sql;
    }

    public RecordData? GetOriginalData(RecordData recordData)
    {
        var tableInfo = GetTableInfo(recordData.TableId);

        var identityColumn = Utils.GetIdentityColumn(tableInfo)?.ColumnName;
        if (identityColumn == null)
            return null;

        var recordId = recordData.Columns.GetValueOrDefault(identityColumn);
        if (recordId == null)
            return null;

        var columns = GetRecord(tableInfo.Schema, tableInfo.Table, recordId);
        if (columns == null)
            return null;

        var dependencies = recordData.Dependencies.Select(d => GetOriginalData(d)).Where(d => d != null).ToList();

        var record = new RecordData
        {
            TableId = recordData.TableId,
            ParentColumn = recordData.ParentColumn,
            Columns = columns,
            Dependencies = dependencies!,
        };

        return record;
    }


    public void GetMergeSql(RecordData recordData, List<string> sqls)
    {
        var tableInfo = GetTableInfo(recordData.TableId);
        var selectColumnsSql = GetAssignationValueSql(tableInfo.Columns, recordData);
        var identifierColumns = Utils.GetIdentifierColumns(tableInfo);
        var updatableColumns = Utils.GetUpdateableColumns(tableInfo);
        var insertableColumns = Utils.GetInsertableColumns(tableInfo);

        recordData.Dependencies.ForEach(d => GetMergeSql(d, sqls));

        var sql = $""" 
        MERGE INTO [{tableInfo.Schema}].[{tableInfo.Table}] AS T 
        USING (SELECT
        {"\t" + string.Join(",\n\t", selectColumnsSql)}
        ) AS S 
        ON {string.Join(" AND ", identifierColumns.Select(c => $"T.{prefixCN}{c.ColumnName}{sufixCN} = S.{prefixCN}{c.ColumnName}{sufixCN}"))}
        WHEN MATCHED THEN UPDATE SET {string.Join(", ", updatableColumns.Select(c => $"T.{prefixCN}{c.ColumnName}{sufixCN} = S.{prefixCN}{c.ColumnName}{sufixCN}"))}
        WHEN NOT MATCHED THEN INSERT ({string.Join(", ", insertableColumns.Select(c => $"{prefixCN}{c.ColumnName}{sufixCN}"))})
        VALUES ({string.Join(", ", insertableColumns.Select(c => $"S.{prefixCN}{c.ColumnName}{sufixCN}"))})
        ;
        """;

        sqls.Add(sql);
    }

    public async Task<PagedResult<Dictionary<string, string?>>> GetTableRows(
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

    public Dictionary<string, string?>? GetRecord(string schema, string table, string recordId)
    {
        var tableInfo = GetTableInfo(schema, table);
        var identityColumn = Utils.GetIdentityColumn(tableInfo) ?? throw new Exception("Identity column not found");
        if (string.IsNullOrWhiteSpace(recordId)) throw new Exception("Invalid recordId");

        var result = ApiRepository.GetRecord(_connectionString, schema, table, identityColumn.ColumnName, recordId).Result;

        return result;
    }
}

using DbStudio.Database;
using DbStudio.Dtos;
using DbStudio.Models;
using Microsoft.Extensions.Configuration;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using static System.Runtime.InteropServices.Marshalling.IIUnknownCacheStrategy;

namespace DbStudio.Services;

public class DatabaseContextinstance
{
    private readonly string _connectionString;
    private Lazy<List<TableInfoDto>> tableInfosLazy;
    private readonly string _connectionName;
    private readonly IDatabase _db;
    private readonly ConfigDatabase _configDatabase;

    public DatabaseContextinstance(ConfigDatabase configDatabase, string connectionName, string connectionString)
    {
        _connectionName = connectionName;
        _connectionString = connectionString;
        _configDatabase = configDatabase;
        _db = DatabaseFactory.Create(connectionName, connectionString);
        tableInfosLazy = new Lazy<List<TableInfoDto>>(() => LoadDatabaseStructure().Result);
    }

    public TableInfoDto GetTableInfo(string schema, string table)
    {
        return tableInfosLazy.Value.FirstOrDefault(t => t.Schema == schema && t.Table == table)
            ?? throw new Exception("Table not found");
    }

    public List<TableInfoDto> GetDatabaseStructure()
    {
        return tableInfosLazy.Value;
    }

    private async Task<List<TableInfoDto>> LoadDatabaseStructure()
    {
        var tables = new List<TableInfoDto>();
        var allColumns = await _db.GetColumns();
        var customColumnConfigs = await _configDatabase.GetCustomColumnConfigs(_connectionName);

        foreach (var column in allColumns)
        {
            if (Utils.IsIdentity(column))
                column.IsIdentity = true;
            if (Utils.IsExtension(column))
                column.IsExtension = true;
            column.DataType = Utils.GetType(column.DbType);

            var cc = customColumnConfigs.FirstOrDefault(c => c.Schema == column.Schema && c.Table == column.Table && c.ColumnName == column.ColumnName);
            if (cc != null)
            {
                column.IsIdentity = cc.IsIdentity ?? column.IsIdentity;
                column.IsExtension = cc.IsExtension ?? column.IsExtension;
                //column.DataType = cc.DataType ?? column.DataType;
                column.IsPK = cc.IsPK ?? column.IsPK;
                column.IsFK = cc.IsFK ?? column.IsFK;
                column.IsUK = cc.IsUK ?? column.IsUK;
                column.SchemaFK = cc.SchemaFK ?? column.SchemaFK;
                column.TableFK = cc.TableFK ?? column.TableFK;
                column.DefaultValue = cc.DefaultValue ?? column.DefaultValue;
                column.IsNullable = cc.IsNullable ?? column.IsNullable;
                column.IsCustom = true;
            }
        }

        foreach (var group in allColumns.GroupBy(c => c.TableId))
        {
            var tableColumns = group.ToList();
            var firstColumn = tableColumns.First();

            tables.Add(new TableInfoDto
            {
                Schema = firstColumn.Schema,
                Table = firstColumn.Table,
                IsExtension = tableColumns.Any(c => c.IsExtension),
                IdentityColumn = tableColumns.FirstOrDefault(c => c.IsIdentity)?.ColumnName,
                IdentifierColumns = Utils.FilterIdentifierColumns(tableColumns).Select(c => c.ColumnName).ToList(),
                UpdateableColumns = Utils.FilterUpdateableColumns(tableColumns).Select(c => c.ColumnName).ToList(),
                InsertableColumns = Utils.FilterInsertableColumns(tableColumns).Select(c => c.ColumnName).ToList(),
                Columns = tableColumns,
            });
        }

        return tables.OrderBy(e => e.Table).OrderBy(e => e.Schema).ToList();
    }

    public List<string> GetAssignationValueSql(List<ColumnInfoDto> columns, ItemDataDto recordData, string? prefix = null, bool isCondition = false)
    {
        return columns
            .Select(c =>
            {
                var rowValue = recordData.Columns.GetValueOrDefault(c.ColumnName);
                var Dep = rowValue != null ? recordData.Dependencies.FirstOrDefault(d => d.ParentColumn == c.ColumnName) : null;
                var represetnationValue = c.IsFK && Dep != null ? $"({SelectIdentity(Dep)})" : rowValue?.ToString();

                return _db.GetAssignationValueSql(c, represetnationValue, prefix, isCondition);
            }).ToList();
    }

    public string SelectIdentity(ItemDataDto recordData)
    {
        var tableInfo = GetTableInfo(recordData.Schema, recordData.Table);
        var identifierColumns = Utils.GetIdentifierColumns(tableInfo);
        var conditionColumns = GetAssignationValueSql(identifierColumns, recordData, null, true);

        var sql = _db.SelectIdentity(tableInfo, conditionColumns);

        return sql;
    }

    public ItemDataDto? GetOriginalData(ItemDataDto recordData, string? recordId = null)
    {
        var tableInfo = GetTableInfo(recordData.Schema, recordData.Table);

        if (recordId == null)
        {
            if (tableInfo.IdentityColumn == null)
                return null;

            recordId = recordData.Columns.GetValueOrDefault(tableInfo.IdentityColumn);
        }

        if (recordId == null)
            return null;

        var columns = GetRecord(tableInfo.Schema, tableInfo.Table, recordId);
        if (columns == null)
            return null;

        var dependencies = recordData.Dependencies.Select(d =>
        {
            string? fkValue = null;
            _ = d.IsEdition
                ? d.ParentColumn != null && recordData.Columns.TryGetValue(d.ParentColumn, out fkValue)
                : d.ParentColumn != null && columns.TryGetValue(d.ParentColumn, out fkValue);

            return GetOriginalData(d, fkValue);
        }).Where(d => d != null).ToList();

        var record = recordData with
        {
            Columns = columns,
            Dependencies = dependencies!,
        };

        return record;
    }

    public void LoadMergeSql(ItemDataDto recordData, List<string> sqls)
    {
        var tableInfo = GetTableInfo(recordData.Schema, recordData.Table);
        var selectColumnsSql = GetAssignationValueSql(tableInfo.Columns, recordData);

        recordData.Dependencies.ForEach(d => LoadMergeSql(d, sqls));

        if (!recordData.IsEdition)
            return;

        var sql = _db.GetMergeSql(tableInfo, selectColumnsSql);

        sqls.Add(sql);
    }

    public async Task<PagedResult<Dictionary<string, string?>>> GetTableRows(
        string schema,
        string table,
        int page = 1,
        int perPage = 100)
    {
        var tableInfo = GetTableInfo(schema, table);
        return await _db.GetTableRows(tableInfo, page, perPage);
    }

    public Dictionary<string, string?>? GetRecord(string schema, string table, string recordId)
    {
        var tableInfo = GetTableInfo(schema, table);

        if (string.IsNullOrWhiteSpace(recordId))
            throw new Exception("Invalid recordId");

        return _db.GetRecord(tableInfo, recordId).Result;
    }
}

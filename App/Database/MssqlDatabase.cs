namespace DbStudio.Database;

using Dapper;
using DbStudio.Dtos;
using DbStudio.Models;
using DbStudio.Services;
using Microsoft.Data.SqlClient;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Linq;

public class MssqlDatabase : IDatabase
{
    string _connectionString;
    const string prefixCN = "[";
    const string sufixCN = "]";

    public MssqlDatabase(string connectionString)
    {
        this._connectionString = connectionString;
    }

    public async Task<List<ColumnInfoDto>> GetColumns()
    {
        var conn = new SqlConnection(_connectionString);

        // Obtener columnas 
        var columnsQuery = """
        select distinct
            
            c.object_id,
            c.column_id,
            TableId = c.object_id,
            [Schema] = ss.name,
            [Table] = ts.name, 
            ColumnId = c.column_id,
            ColumnName = c.name,  
            DbType = t_base.name, 
            DefaultValue = case 
                when (charindex('((', object_definition(c.default_object_id))) > 0 
                then substring(object_definition(c.default_object_id), 3, len(object_definition(c.default_object_id)) - 4) 
                else substring(object_definition(c.default_object_id), 2, len(object_definition(c.default_object_id)) - 2) 
            end, 
            IsIdentity = c.is_identity,
            IsNullable = c.is_nullable,
            IsPK = CASE WHEN pk.column_id IS NOT NULL THEN 1 ELSE 0 END,
            IsUK = CASE WHEN uk.column_id IS NOT NULL THEN 1 ELSE 0 END,
            IsFK = case when fkc.constraint_column_id is null then 0 else 1 end, 
            IsExtension = case when (select count(column_id) from sys.index_columns where column_id = c.column_id and object_id = c.object_id and column_id = 1 and c.is_identity = 0)> 1 then  1 else 0 end,
            SchemaFK = fks.name,
            TableFK = fkt.name 
        from sys.columns c
            join sys.tables ts ON ts.object_id = c.object_id
            join sys.schemas ss ON ss.schema_id = ts.schema_id
            join sys.types t on t.user_type_id = c.user_type_id 
            join sys.types t_base on t_base.user_type_id = t.system_type_id
            -- Detección de PK
            LEFT JOIN (
                SELECT ic.column_id, ic.object_id
                FROM sys.indexes i
                INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
                INNER JOIN sys.tables t ON i.object_id = t.object_id
                INNER JOIN sys.key_constraints kc ON i.name = kc.name AND kc.type = 'PK'
            ) pk ON c.column_id = pk.column_id AND c.object_id = pk.object_id
            -- Detección de UK (Unique Constraint)
            LEFT JOIN (
                SELECT DISTINCT ixc.object_id, ixc.column_id
                FROM sys.indexes i
                INNER JOIN sys.index_columns ixc ON i.object_id = ixc.object_id AND i.index_id = ixc.index_id
                WHERE i.is_unique = 1
            ) uk ON c.object_id = uk.object_id AND c.column_id = uk.column_id
            -- Resto de los joins
            left join sys.foreign_key_columns fkc on fkc.parent_column_id = c.column_id and fkc.parent_object_id = c.object_id
            left join sys.columns fkcol on fkcol.column_id = fkc.referenced_column_id and fkcol.object_id = fkc.referenced_object_id
            left join sys.tables fkt on fkt.object_id = fkcol.object_id
            left join sys.schemas fks on fks.schema_id = fkt.schema_id
        """;

        var columns = await conn.QueryAsync<ColumnInfoDto>(columnsQuery);
        return columns.ToList();
    }

    public async Task<PagedResult<Dictionary<string, string?>>> GetTableRows(
       TableInfoDto tableInfo,
        int page = 1,
        int perPage = 100)
    {
        var schema = tableInfo.Schema;
        var table = tableInfo.Table;
        var identityColumn = tableInfo.IdentityColumn;
        var identifierColumns = tableInfo.IdentifierColumns;
        var conn = new SqlConnection(_connectionString);
        var orderColumn = identityColumn ?? "(SELECT NULL)";
        var selectIdentity = identityColumn != null && identityColumn.ToLower() != "__id"
            ? $"__id={identityColumn},"
            : "";
        var selectRepresentationColumns = identifierColumns?.Count > 1
            ? $"__repr=CONCAT({string.Join(", '-', ", identifierColumns)}),"
            : identifierColumns?.Count == 1
            ? $"__repr={identifierColumns[0]},"
            : "";

        var query = $"""
        select {selectIdentity} {selectRepresentationColumns} * from [{schema}].[{table}] 
        ORDER BY {orderColumn}
        OFFSET {(page - 1) * perPage} ROWS 
        FETCH NEXT {perPage} ROWS ONLY 
        """;
        var countQuery = $"SELECT COUNT(*) FROM [{schema}].[{table}]";

        var items = (await conn.QueryAsync(query))
            .Cast<IDictionary<string, object>>()
            .Select(e => e.ToDictionary(k => k.Key, v => v.Value?.ToString()))
            .ToList();

        var totalCount = await conn.ExecuteScalarAsync<int>(countQuery);

        return new PagedResult<Dictionary<string, string?>>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PerPage = perPage
        };
    }

    public async Task<Dictionary<string, string?>?> GetRecord(
        TableInfoDto tableInfo,
        string identityValue)
    {
        var schema = tableInfo.Schema;
        var table = tableInfo.Table;
        var identityColumn = tableInfo.Columns.FirstOrDefault(c => c.IsIdentity) ?? throw new Exception("Identity column not found");
        var conn = new SqlConnection(_connectionString);
        var selectIdentity = identityColumn.ColumnName.ToLower() != "__id" ? $"__id={identityColumn.ColumnName}," : "";
        var valueSql = Utils.GetValueSql(identityColumn, identityValue);

        var query = $"""
        select {selectIdentity} * from [{schema}].[{table}] 
        where {identityColumn.ColumnName} = {valueSql}
        """;

        var items = (await conn.QueryAsync(query).ConfigureAwait(false))
            .Cast<IDictionary<string, object>>()
            .FirstOrDefault();

        return items?.ToDictionary(k => k.Key, v => v.Value?.ToString());
    }

    public int? ExecuteScript(string script)
    {
        using (var connection = new SqlConnection(_connectionString))
        {
            return connection.Execute(script);
        }
    }

    public string GetMergeSql(
        TableInfoDto tableInfo,
        List<string> selectColumnsSql)
    {
        return $""" 
        MERGE INTO [{tableInfo.Schema}].[{tableInfo.Table}] AS T 
        USING (SELECT
        {"    " + string.Join(",\n    ", selectColumnsSql)}
        ) AS S 
        ON {string.Join(" AND ", tableInfo.IdentifierColumns.Select(c => $"T.{prefixCN}{c}{sufixCN} = S.{prefixCN}{c}{sufixCN}"))}
        WHEN MATCHED THEN UPDATE SET {string.Join(", ", tableInfo.UpdateableColumns.Select(c => $"T.{prefixCN}{c}{sufixCN} = S.{prefixCN}{c}{sufixCN}"))}
        WHEN NOT MATCHED THEN INSERT ({string.Join(", ", tableInfo.InsertableColumns.Select(c => $"{prefixCN}{c}{sufixCN}"))})
        VALUES ({string.Join(", ", tableInfo.InsertableColumns.Select(c => $"S.{prefixCN}{c}{sufixCN}"))})
        ;
        """;
    }

    public string GetAssignationValueSql(
        ColumnInfoDto column,
        string? value,
        string? prefix = null,
        bool isCondition = false)
    {
        var valueSql = Utils.GetValueSql(column, value);
        var condition = isCondition && valueSql == "NULL" ? "IS" : "=";
        return $"{prefix ?? ""}{prefixCN}{column.ColumnName}{sufixCN} {condition} {valueSql}";
    }

    public string SelectIdentity(
        TableInfoDto tableInfo,
        List<string> conditionColumns)
    {
        return $"""
        SELECT {tableInfo.IdentityColumn} FROM [{tableInfo.Schema}].[{tableInfo.Table}] WHERE {string.Join(" AND ", conditionColumns)}
        """;
    }
}

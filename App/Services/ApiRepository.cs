using Dapper;
using Microsoft.Data.SqlClient;
using DbStudio.Dtos;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using DbStudio.Models;
using Microsoft.Data.Sqlite;

namespace DbStudio.Services;

public class ApiRepository
{
    public static async Task<List<ColumnInfoRecord>> GetColumns(string connectionString)
    {
        var _dbConnection = new SqlConnection(connectionString);

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
            DbType = t.name, 
            DataType = t_base.name, 
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

        var columns = await _dbConnection.QueryAsync<ColumnInfoRecord>(columnsQuery);
        return columns.ToList();
    }

    public static async Task<List<TableInfo>> GetDatabaseStructure(string connectionName, string connectionString)
    {
        var tables = new List<TableInfo>();
        var allColumns = await GetColumns(connectionString);
        var customColumnConfigs = await GetCustomColumnConfigs(connectionName);

        foreach (var column in allColumns)
        {
            if (Utils.IsIdentity(column))
                column.IsIdentity = true;
            if (Utils.IsExtension(column))
                column.IsExtension = true;
            column.DataType = Utils.GetType(column.DbType ?? column.DataType);

            var cc = customColumnConfigs.FirstOrDefault(c => c.Schema == column.Schema && c.Table == column.Table && c.ColumnName == column.ColumnName);
            if (cc != null)
            {
                column.IsIdentity = cc.IsIdentity ?? column.IsIdentity;
                column.IsExtension = cc.IsExtension ?? column.IsExtension;
                column.DataType = cc.DataType ?? column.DataType;
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

            tables.Add(new TableInfo
            {
                //TableId = firstColumn.TableId,
                Schema = firstColumn.Schema,
                Table = firstColumn.Table,
                IsEntity = Utils.IsEntity(tableColumns),
                IsExtension = tableColumns.Any(c => c.IsExtension),
                Columns = tableColumns,
                IdentityColumn = tableColumns.FirstOrDefault(c => c.IsIdentity)?.ColumnName
            });
        }

        return tables.OrderBy(e => e.Table).OrderBy(e => e.Schema).ToList();
    }

    public static async Task<List<CustomColumnInfo>> GetCustomColumnConfigs(string connectionName)
    {
        var dbConnection = new SqliteConnection("Data Source=DbStudio.db");

        var columnsQuery = $"""
        Select * from CustomColumnConfigs where connectionName = "{connectionName}"
        """;

        var columns = await dbConnection.QueryAsync<CustomColumnInfo>(columnsQuery);
        return columns.ToList();
    }

    public static async Task DefineColumnConfig(string connectionName, CustomColumnInfo[] customColumnInfos)
    {
        var dbConnection = new SqliteConnection("Data Source=DbStudio.db");

        var query = """
        replace into CustomColumnConfigs ([ConnectionName], [Schema], [Table], [ColumnName], [DataType], [IsIdentity], [IsNullable], [IsPK], [IsFK], [IsUK], [IsExtension], [SchemaFK], [TableFK]) 
        values (@ConnectionName, @Schema, @Table, @ColumnName, @DataType, @IsIdentity, @IsNullable, @IsPK, @IsFK, @IsUK, @IsExtension, @SchemaFK, @TableFK)
        """;

        await dbConnection.ExecuteAsync(query, customColumnInfos);
        var res = await GetCustomColumnConfigs(connectionName);
    }

    public static async Task DefineConnection(string connectionName, string connectionString)
    {
        var dbConnection = new SqliteConnection("Data Source=DbStudio.db");

        var query = """
        replace into Connections (ConnectionName, ConnectionString) values (@connectionName, @connectionString)
        """;

        await dbConnection.ExecuteAsync(query, new { connectionName, connectionString });
    }

    public static async Task<List<ConnectionRecord>> GetConnections()
    {
        var dbConnection = new SqliteConnection("Data Source=DbStudio.db");

        var query = """
        select ConnectionName, ConnectionString from Connections
        """;

        var connections = await dbConnection.QueryAsync<ConnectionRecord>(query);
        return connections.ToList();
    }

    public static async Task InitCustomColumnConfigs()
    {
        var dbConnection = new SqliteConnection("Data Source=DbStudio.db");

        var query = $"""
        create table if not exists CustomColumnConfigs (
            [ConnectionName] text not null, 
            [Schema] text not null,
            [Table] text not null, 
            [ColumnName] text not null,
            [DataType] text null,
            [IsIdentity] bit null,
            [IsNullable] bit null, 
            [IsPK] bit null,
            [IsFK] bit null,
            [IsUK] bit null,
            [IsExtension] bit null,
            [SchemaFK] text null,
            [TableFK] text null, 
            primary key ([ConnectionName], [Schema], [Table], [ColumnName])
        )
        """;

        await dbConnection.ExecuteAsync(query);

        query = $"""
        create table if not exists Connections (
            [ConnectionName] text not null, 
            [ConnectionString] text not null, 
            primary key ([ConnectionName])
        )
        """;

        await dbConnection.ExecuteAsync(query);
    }

    public static async Task<PagedResult<Dictionary<string, string?>>> GetTableRows(
        string connectionString,
        string schema,
        string table,
        string? identityColumn = null,
        List<string> representationColumns = null,
        int page = 1,
        int perPage = 100)
    {
        var _dbConnection = new SqlConnection(connectionString);
        var orderColumn = identityColumn ?? "(SELECT NULL)";
        var selectIdentity = identityColumn != null && identityColumn.ToLower() != "__id"
            ? $"__id={identityColumn},"
            : "";
        var selectRepresentationColumns = representationColumns?.Count > 1
            ? $"__repr=CONCAT({string.Join(", '-', ", representationColumns)}),"
            : representationColumns?.Count == 1
            ? $"__repr={representationColumns[0]},"
            : "";

        var query = $"""
        select {selectIdentity} {selectRepresentationColumns} * from [{schema}].[{table}] 
        ORDER BY {orderColumn}
        OFFSET {(page - 1) * perPage} ROWS 
        FETCH NEXT {perPage} ROWS ONLY 
        """;
        var countQuery = $"SELECT COUNT(*) FROM [{schema}].[{table}]";

        var items = (await _dbConnection.QueryAsync(query))
            .Cast<IDictionary<string, object>>()
            .Select(e => e.ToDictionary(k => k.Key, v => v.Value?.ToString()))
            .ToList();

        var totalCount = await _dbConnection.ExecuteScalarAsync<int>(countQuery);

        return new PagedResult<Dictionary<string, string?>>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PerPage = perPage
        };
    }

    public static async Task<Dictionary<string, string?>?> GetRecord(
        string connectionString,
        string schema,
        string table,
        string identityColumn,
        string identityValue)
    {
        var _dbConnection = new SqlConnection(connectionString);
        var selectIdentity = identityColumn != null && identityColumn.ToLower() != "__id" ? $"__id={identityColumn}," : "";

        var query = $"""
        select {selectIdentity} * from [{schema}].[{table}] 
        where {identityColumn} = {identityValue}
        """;

        var items = (await _dbConnection.QueryAsync(query))
            .Cast<IDictionary<string, object>>()
            .FirstOrDefault();

        return items?.ToDictionary(k => k.Key, v => v.Value?.ToString());
    }

    public int? ExecuteScript(string connectionString, string script)
    {
        using (var connection = new SqlConnection(connectionString))
        {
            return connection.Execute(script);
        }
    }
}

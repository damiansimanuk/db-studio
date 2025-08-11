namespace DbStudio.Database;

using Dapper;
using DbStudio.Dtos;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Data.Sqlite;

public class ConfigDatabase
{
    private string _connectionString;

    public ConfigDatabase(string connectionString = "Data Source=DbStudio.db")
    {
        _connectionString = connectionString;
    }

    public async Task<List<CustomColumnInfoDto>> GetCustomColumnConfigs(string connectionName)
    {
        var dbConnection = new SqliteConnection(_connectionString);

        var columnsQuery = $"""
        Select * from CustomColumnConfigs where connectionName = "{connectionName}"
        """;

        var columns = await dbConnection.QueryAsync<CustomColumnInfoDto>(columnsQuery);
        return columns.ToList();
    }

    public async Task DefineColumnConfig(string connectionName, CustomColumnInfoDto[] customColumnInfos)
    {
        var dbConnection = new SqliteConnection(_connectionString);

        var query = """
        replace into CustomColumnConfigs ([ConnectionName], [Schema], [Table], [ColumnName], [IsIdentity], [IsNullable], [IsPK], [IsFK], [IsUK], [IsExtension], [SchemaFK], [TableFK]) 
        values (@ConnectionName, @Schema, @Table, @ColumnName, @IsIdentity, @IsNullable, @IsPK, @IsFK, @IsUK, @IsExtension, @SchemaFK, @TableFK)
        """;

        await dbConnection.ExecuteAsync(query, customColumnInfos);
        var res = await GetCustomColumnConfigs(connectionName);
    }

    public async Task DefineConnection(string connectionName, string connectionString)
    {
        var dbConnection = new SqliteConnection(_connectionString);

        var query = """
        replace into Connections (ConnectionName, ConnectionString) values (@connectionName, @connectionString)
        """;

        await dbConnection.ExecuteAsync(query, new { connectionName, connectionString });
    }

    public async Task<List<ConnectionDto>> GetConnections()
    {
        var dbConnection = new SqliteConnection(_connectionString);

        var query = """
        select ConnectionName, ConnectionString from Connections
        """;

        var connections = await dbConnection.QueryAsync<ConnectionDto>(query);
        return connections.ToList();
    }

    public async Task InitCustomColumnConfigs()
    {
        var dbConnection = new SqliteConnection(_connectionString);

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

}

using DbStudio.Dtos;
using DbStudio.Models;

namespace DbStudio.Services;

internal interface IDatabase
{
    Task<PagedResult<Dictionary<string, string?>>> GetTableRows(
        TableInfoDto tableInfo,
        int page = 1,
        int perPage = 100);

    Task<List<ColumnInfoDto>> GetColumns();

    Task<Dictionary<string, string?>?> GetRecord(
        TableInfoDto tableInfo,
        string identityValue);

    int? ExecuteScript(string script);

    string GetMergeSql(
        TableInfoDto tableInfo,
        List<string> selectColumnsSql);

    string GetAssignationValueSql(
        ColumnInfoDto column,
        string? value,
        string? prefix = null,
        bool isCondition = false);

    string SelectIdentity(
        TableInfoDto tableInfo,
        List<string> conditionColumns);
}

using DbStudio.Dtos;
using System.Data;
using System.Globalization;
using System.Text;
using System;

namespace DbStudio.Services;

public class Utils
{

    public static CultureInfo Culture { get; set; } = CultureInfo.CreateSpecificCulture("en-US");

    public static bool IsEntity(List<ColumnInfoRecord> tableColumns)
    {
        var requiredColumns = new[] { "Code", "Name", "Description" };
        return tableColumns.Any(c => c.IsIdentity)
            && tableColumns.Count(c => requiredColumns.Contains(c.ColumnName, StringComparer.OrdinalIgnoreCase)) == requiredColumns.Length;
    }

    public static bool IsIdentity(ColumnInfoRecord column)
    {
        return column.IsIdentity || IsIdentityColumnName(column);
    }

    public static bool IsIdentityColumnName(ColumnInfoRecord column)
    {
        var colNameSnake = ToSnakeCase(column.Table);
        var names = new[] {
            $"id",
            $"id{column.Table}",
            $"{column.Table}id",
            $"id_{colNameSnake}",
            $"{colNameSnake}_id"
        };
        return names.Contains(column.ColumnName, StringComparer.InvariantCultureIgnoreCase) && column.IsPK;
    }

    public static string ToSnakeCase(string text)
    {
        if (string.IsNullOrEmpty(text))
            return text;

        if (text.Contains("_"))
            return text;

        var res = text.SelectMany((c, i) => char.IsUpper(c) && i > 0 ? "_" + char.ToLowerInvariant(c) : c.ToString());

        return string.Join("", res);
    }

    public static bool IsExtension(ColumnInfoRecord column)
    {
        return column.IsFK &&
            (column.IsExtension ||
            (!column.IsIdentity && column.ColumnName.Equals($"Id{column.TableFK}", StringComparison.InvariantCultureIgnoreCase) && column.IsPK));
    }

    public static List<ColumnInfoRecord> GetIdentifierColumns(TableInfo tableInfo)
    {
        var ukColumns = tableInfo.Columns.Where(c => FilterParametersOnly(c) && ((c.IsPK && !c.IsIdentity) || c.IsUK)).ToList();
        if (ukColumns?.Any() != true)
            ukColumns = tableInfo.Columns.Where(c => c.IsUK).ToList();
        if (ukColumns?.Any() != true && IsEntity(tableInfo.Columns))
            ukColumns = tableInfo.Columns.Where(c => c.ColumnName == "Code").ToList();
        if (ukColumns?.Any() != true)
            ukColumns = tableInfo.Columns.Where(c => c.IsIdentity || c.IsExtension).ToList();

        return ukColumns;
    }

    public static List<ColumnInfoRecord> GetInsertableColumns(TableInfo tableInfo)
    {
        return tableInfo.Columns.Where(c => !IsIdentity(c)).ToList();
    }

    public static List<ColumnInfoRecord> GetUpdateableColumns(TableInfo tableInfo)
    {
        return tableInfo.Columns.Where(c => !IsIdentity(c) && !IsExtension(c) && !IsCreationTime(c)).ToList();
    }

    public static ColumnInfoRecord GetIdentityColumn(TableInfo tableInfo)
    {
        return tableInfo.Columns.FirstOrDefault(c => c.IsIdentity);
    }

    public static bool FilterParametersOnly(ColumnInfoRecord column)
    {
        var timeColumns = new[] { "InsDateTime", "UpdDateTime", "CreatedAt", "UpdatedAt" };
        return (!IsIdentity(column) || IsExtension(column))
            && !timeColumns.Contains(column.ColumnName, StringComparer.OrdinalIgnoreCase);
    }

    public static bool IsUpdateTime(ColumnInfoRecord columnInfo)
    {
        var timeColumns = new[] { "UpdDateTime", "UpdatedAt" };
        return timeColumns.Contains(columnInfo.ColumnName, StringComparer.OrdinalIgnoreCase);
    }

    public static bool IsCreationTime(ColumnInfoRecord columnInfo)
    {
        var timeColumns = new[] { "InsDateTime", "CreatedAt" };
        return timeColumns.Contains(columnInfo.ColumnName, StringComparer.OrdinalIgnoreCase);
    }

    public static string CamelCase(string word)
    {
        return word.Substring(0, 1).ToLower() + word.Substring(1);
    }

    public static string PascalCase(string word)
    {
        return word.Substring(0, 1).ToUpper() + word.Substring(1);
    }

    public static string GetValueSql(ColumnInfoRecord column, string? value)
    {
        if (IsUpdateTime(column) || IsCreationTime(column))
            return "sysdatetimeoffset()";

        if (value != null && value.StartsWith("(") && value.EndsWith(")"))
            return value;

        return ParamValueToString(column.DataType, value);
    }

    public static List<string> GetRepresentationColumns(TableInfo tableInfo)
    {
        var ukColumns = GetIdentifierColumns(tableInfo);
        return ukColumns.Select(c => c.ColumnName).ToList();
    }

    public static string ParamValueToString(string dataType, string? value)
    {
        if (value == null)
        {
            return "NULL";
        }

        bool resParse;

        switch (dataType)
        {
            case "bool":
                resParse = (value == "1" || value == "true") || (bool.TryParse(value, out var res) && res);
                return resParse ? "1" : "0";
            case "short":
            case "int":
            case "long":
                return Convert.ToInt64(value).ToString();
            case "decimal":
                return Convert.ToDecimal(value).ToString();
            case "float":
                return Convert.ToSingle(value).ToString("R", Culture);
            case "double":
                return Convert.ToDouble(value).ToString("R", Culture);
            case "string":
                return $"'{((string)value).Replace("'", "''")}'";
            case "TimeSpan":
                resParse = TimeSpan.TryParse(value, out var timeSpan);
                return resParse ? $"'{timeSpan.ToString("c")}'" : "NULL";
            case "byte[]":
                var bytes = Encoding.UTF8.GetBytes(value);
                return "0x" + BitConverter.ToString(bytes).Replace("-", string.Empty);
            case "DateTimeOffset":
                resParse = DateTimeOffset.TryParse(value, out var dateTimeOffset);
                return resParse ? $"'{dateTimeOffset.ToString("O")}'" : "NULL";
            case "char":
            default:
                return $"'{value}'";
        }
    }

    public static string GetType(string dbType)
    {
        dbType = dbType.Replace("[", "").Replace("]", "").Replace("Common.", "").Trim();

        switch (dbType)
        {
            case "TCode":
            case "TName":
            case "TDescription":
            case "nvarchar":
            case "varchar":
            case "nchar":
                return "string";
            case "char":
                return "char";
            case "TActive":
            case "bit":
                return "bool";
            case "time":
                return "TimeSpan";
            case "date":
            case "datetimeoffset":
            case "smalldatetime":
            case "datetime2":
            case "TDateTime":
                return "DateTimeOffset";
            case "bigint":
                return "Int64";
            case "int":
                return "int";
            case "tinyint":
            case "smallint":
                return "short";
            case "real":
            case "float":
                return "float";
            case "numeric":
            case "decimal":
                return "decimal";
            case "varbinary":
            case "binary":
                return "byte[]";
            case "sql_variant":
                return "object";
            default:
                return dbType;
        }
    }
}

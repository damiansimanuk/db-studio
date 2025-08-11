namespace DbStudio.Services;

using Azure;
using DbStudio.Dtos;
using System;
using System.Data;
using System.Globalization;
using System.Text;

public class Utils
{

    public static CultureInfo Culture { get; set; } = CultureInfo.CreateSpecificCulture("en-US");

    public static bool IsEntity(List<ColumnInfoDto> tableColumns)
    {
        var requiredColumns = new[] { "Code", "Name", "Description" };
        return tableColumns.Any(c => c.IsIdentity)
            && tableColumns.Count(c => requiredColumns.Contains(c.ColumnName, StringComparer.OrdinalIgnoreCase)) == requiredColumns.Length;
    }

    public static bool IsIdentity(ColumnInfoDto column)
    {
        return column.IsIdentity || (IsIdentityColumnName(column.Table, column.ColumnName) && column.IsPK);
    }

    public static bool IsIdentityColumnName(string table, string columnName)
    {
        var colNameSnake = ToSnakeCase(table);
        var names = new[] {
            $"id",
            $"id{table}",
            $"{table}id",
            $"id_{table}",
            $"{table}_id",
            $"id_{colNameSnake}",
            $"{colNameSnake}_id"
        };
        return names.Contains(columnName, StringComparer.InvariantCultureIgnoreCase);
    }

    private static string ToSnakeCase(string text)
    {
        if (string.IsNullOrEmpty(text))
            return text;

        if (text.Contains("_"))
            return text;

        var res = text.SelectMany((c, i) => char.IsUpper(c) && i > 0 ? "_" + char.ToLowerInvariant(c) : c.ToString());

        return string.Join("", res);
    }

    public static bool IsExtension(ColumnInfoDto column)
    {
        return column.IsFK &&
            (column.IsExtension ||
            (!column.IsIdentity && IsIdentityColumnName(column.Table, column.ColumnName) && column.IsPK));
    }

    public static List<ColumnInfoDto> FilterIdentifierColumns(List<ColumnInfoDto> columns)
    {
        var ukColumns = columns.Where(c => FilterParametersOnly(c) && ((c.IsPK && !c.IsIdentity) || c.IsUK)).ToList();
        if (ukColumns.Any() != true)
            ukColumns = columns.Where(c => c.IsUK).ToList();
        if (ukColumns.Any() != true)
            ukColumns = columns.Where(c => c.IsIdentity || c.IsExtension).ToList();

        return ukColumns;
    }

    public static List<ColumnInfoDto> GetIdentifierColumns(TableInfoDto tableInfo)
    {
        return tableInfo.Columns.Where(c => tableInfo.IdentifierColumns.Contains(c.ColumnName)).ToList();
    }

    public static List<ColumnInfoDto> FilterInsertableColumns(List<ColumnInfoDto> columns)
    {
        return columns.Where(c => !c.IsIdentity).ToList();
    }

    public static List<ColumnInfoDto> FilterUpdateableColumns(List<ColumnInfoDto> columns)
    {
        return columns.Where(c => !c.IsIdentity && !c.IsExtension && !IsCreationTime(c)).ToList();
    }

    public static bool FilterParametersOnly(ColumnInfoDto column)
    {
        var timeColumns = new[] { "InsDateTime", "UpdDateTime", "CreatedAt", "UpdatedAt" };
        return (!IsIdentity(column) || IsExtension(column))
            && !timeColumns.Contains(column.ColumnName, StringComparer.OrdinalIgnoreCase);
    }

    public static bool IsUpdateTime(ColumnInfoDto columnInfo)
    {
        var timeColumns = new[] { "UpdDateTime", "UpdatedAt" };
        return timeColumns.Contains(columnInfo.ColumnName, StringComparer.OrdinalIgnoreCase);
    }

    public static bool IsCreationTime(ColumnInfoDto columnInfo)
    {
        var timeColumns = new[] { "InsDateTime", "CreatedAt" };
        return timeColumns.Contains(columnInfo.ColumnName, StringComparer.OrdinalIgnoreCase);
    }

    public static string GetValueSql(ColumnInfoDto column, string? value)
    {
        if (IsUpdateTime(column) || IsCreationTime(column))
            return "sysdatetimeoffset()";

        if (value != null && value.StartsWith("(") && value.EndsWith(")"))
            return value;

        return ParamValueToString(column.DataType, value);
    }

    public static string ParamValueToString(DataTypeEnum dataType, string? value)
    {
        if (value == null)
        {
            return "NULL";
        }

        switch (dataType)
        {
            case DataTypeEnum.Boolean:
                return (value == "1" || value.ToLower() == "true") ? "1" : "0";

            case DataTypeEnum.Integer:
                return Convert.ToInt64(value).ToString(Culture);

            case DataTypeEnum.Decimal:
                return Convert.ToDecimal(value).ToString(Culture);

            case DataTypeEnum.Float:
                return Convert.ToDouble(value).ToString("R", Culture);

            case DataTypeEnum.TimeOnly:
                var isTime = TimeSpan.TryParse(value, out var timeSpan);
                return isTime ? $"'{timeSpan.ToString("c")}'" : "NULL";

            case DataTypeEnum.Binary:
                var bytes = Encoding.UTF8.GetBytes(value);
                return "0x" + BitConverter.ToString(bytes).Replace("-", string.Empty);

            case DataTypeEnum.DateTimeOffset:
                var isDateTimeOffset = DateTimeOffset.TryParse(value, out var dateTimeOffset);
                return isDateTimeOffset ? $"'{dateTimeOffset.ToString("O")}'" : "NULL";

            case DataTypeEnum.DateTime:
                var isDateTime = DateTime.TryParse(value, out var dateTime);
                return isDateTime ? $"'{dateTime.ToString("O")}'" : "NULL";

            case DataTypeEnum.String:
            case DataTypeEnum.Json:
            case DataTypeEnum.Xml:
                return $"'{value.Replace("'", "''")}'";

            case DataTypeEnum.Guid:
            case DataTypeEnum.Char:
            default:
                return $"'{value}'";
        }
    }

    public static DataTypeEnum GetType(string? dbType)
    {
        if (dbType == null)
            return DataTypeEnum.Undefined;

        dbType = dbType.Replace("[", "").Replace("]", "").Replace("Common.", "").Trim();

        switch (dbType)
        {
            case "TCode":
            case "TName":
            case "TDescription":
            case "nvarchar":
            case "varchar":
            case "nchar":
                return DataTypeEnum.String;
            case "char":
                return DataTypeEnum.Char;
            case "TActive":
            case "bit":
                return DataTypeEnum.Boolean;
            case "time":
                return DataTypeEnum.TimeOnly;
            case "TDateTime":
            case "datetimeoffset":
            case "datetimeoffset2":
                return DataTypeEnum.DateTimeOffset;
            case "date":
            case "datetime2":
            case "smalldatetime":
                return DataTypeEnum.DateTime;
            case "bigint":
            case "int":
            case "tinyint":
            case "smallint":
                return DataTypeEnum.Integer;
            case "real":
            case "float":
                return DataTypeEnum.Float;
            case "numeric":
            case "decimal":
                return DataTypeEnum.Decimal;
            case "varbinary":
            case "binary":
                return DataTypeEnum.Binary;
            default:
                return DataTypeEnum.Undefined;
        }
    }
}

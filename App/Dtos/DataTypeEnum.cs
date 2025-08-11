namespace DbStudio.Dtos;

using System.Text.Json.Serialization;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum DataTypeEnum
{
    Undefined,
    String,
    Char,
    Integer,
    Decimal,
    Float,
    Boolean,
    DateTime,
    DateTimeOffset,
    TimeOnly,
    Binary,
    Json,
    Xml,
    Guid,
}

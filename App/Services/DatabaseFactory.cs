using DbStudio.Database;

namespace DbStudio.Services;

internal class DatabaseFactory
{
    public static IDatabase Create(string connectionName, string connectionString)
    {
        //var connectionString = _configuration.GetConnectionString(connectionName);
        //if (string.IsNullOrWhiteSpace(connectionString))
        //    throw new Exception($"Connection string '{connectionName}' not found in configuration.");
        //return new DatabaseContextinstance(connectionName, connectionString);
        return new MssqlDatabase(connectionString);
    }
}

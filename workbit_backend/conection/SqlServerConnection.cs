using Microsoft.Data.SqlClient;
using System;
using System.Data;
using System.Threading.Tasks;
using workbit.Config;

namespace connectionSqlServer
{
    public static class SqlServerConnection
    {
        private static string conexion()
        {
            var config = AppConfigManager.Configuration;
            
            // Si tenemos configuración de Azure SQL Database, la usamos
            if (!string.IsNullOrEmpty(config.ConnectionStrings.SqlServer.Server) && 
                config.ConnectionStrings.SqlServer.Server.Contains("database.windows.net"))
            {
                // Conexión para Azure SQL Database
                return $"Server=tcp:{config.ConnectionStrings.SqlServer.Server},1433;" +
                       $"Initial Catalog={config.ConnectionStrings.SqlServer.Database};" +
                       $"Persist Security Info=False;" +
                       $"User ID={config.ConnectionStrings.SqlServer.UserId};" +
                       $"Password={config.ConnectionStrings.SqlServer.Password};" +
                       $"MultipleActiveResultSets=False;" +
                       $"Encrypt=True;" +
                       $"TrustServerCertificate=False;" +
                       $"Connection Timeout=30;";
            }
            else
            {
                // Fallback para desarrollo local
                return $"Server={config.ConnectionStrings.SqlServer.Server};" +
                       $"Database={config.ConnectionStrings.SqlServer.Database};" +
                       $"Integrated Security=True;" +
                       $"TrustServerCertificate=True;";
            }
        }

        public static DataTable EjecutarQuery(SqlCommand connect)
        {
            using (SqlConnection connection = new SqlConnection(conexion()))
            {
                try
                {
                    connection.Open();
                    connect.Connection = connection;
                    DataTable table = new DataTable();
                    using (SqlDataAdapter adapter = new SqlDataAdapter(connect))
                    {
                        adapter.Fill(table);
                    }
                    return table;
                }
                catch (Exception ex)
                {
                    throw new Exception($"Error executing query: {ex.Message}", ex);
                }

            }
        }

        public static int ExecuteNonQuery(SqlCommand connect)
        {
            using (SqlConnection connection = new SqlConnection(conexion()))
            {
                try
                {
                    connection.Open();
                    connect.Connection = connection;
                    return connect.ExecuteNonQuery();
                }
                catch (Exception ex)
                {
                    throw new Exception($"Error executing non-query: {ex.Message}", ex);
                }
            }
        }

    }
}
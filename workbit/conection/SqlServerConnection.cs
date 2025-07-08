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

            return "Server=ALDOYAMIL\\SQLEXPRESS;Database=workbit;Integrated Security=True;TrustServerCertificate=True;";
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
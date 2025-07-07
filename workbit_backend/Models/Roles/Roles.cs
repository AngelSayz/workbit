using Microsoft.Data.SqlClient;
using System;
using System.Data;
using connectionSqlServer; // Asegúrate de importar tu conexión

namespace workbit.Models.Roles
{
    public class Roles
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;

        // 👇 Agrega aquí el método estático
        public static int ObtenerRoleIdPorNombre(string roleName)
        {
            SqlCommand cmd = new SqlCommand("SELECT id FROM roles WHERE name = @name");
            cmd.Parameters.AddWithValue("@name", roleName);
            DataTable table = SqlServerConnection.EjecutarQuery(cmd);

            if (table.Rows.Count > 0)
                return Convert.ToInt32(table.Rows[0]["id"]);
            else
                throw new Exception("Rol no encontrado");
        }
    }
}

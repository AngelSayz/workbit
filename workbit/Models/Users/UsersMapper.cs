using Microsoft.Data.SqlClient;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using workbit.Models.Roles;

namespace workbit.Models.Users
{
    public class UsersMapper
    {
        public static Users ConvertirAObjeto(DataRow fila)
        {
            int id = Convert.ToInt32(fila["ID"]); 
            string name = fila["Name"]?.ToString() ?? string.Empty;
            string lastname = fila["Lastname"]?.ToString() ?? string.Empty;
            string username = fila["Username"]?.ToString() ?? string.Empty;
            string email = fila["Email"]?.ToString() ?? string.Empty;
            string password = fila.Table.Columns.Contains("Password") ? fila["Password"]?.ToString() ?? string.Empty : "";
            int roleId = Convert.ToInt32(fila["RoleId"]);

            // Crear objeto usuario con constructor
            Users user = new Users(id, name, lastname, username, email, password, roleId);

            // Asignar el objeto de rol si existe el campo "RoleName"
            if (fila.Table.Columns.Contains("RoleName"))
            {
                user.Roles = new Roles.Roles
                {
                    Id = roleId,
                    Name = fila["RoleName"]?.ToString() ?? string.Empty
                };
            }

            return user;
        }

        public static List<Users> ConvertirLista(DataTable tabla)
        {
            List<Users> list = new List<Users>();
            foreach (DataRow fila in tabla.Rows)
            {
                list.Add(ConvertirAObjeto(fila));
            }
            return list;
        }
    }
}

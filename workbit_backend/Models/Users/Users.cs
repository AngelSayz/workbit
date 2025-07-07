using connectionSqlServer;
using Microsoft.Data.SqlClient;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Data;
using System.Linq;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using workbit.MessagesTypes;
using workbit.ViewModels;
using workbit.Models.Users.DTO;
using static workbit.Models.Roles.Roles;

namespace workbit.Models.Users
{
    public class Users
    {
        private int _id;
        private string _name = string.Empty;
        private string _lastname = string.Empty;
        private string _username = string.Empty;
        private string _email = string.Empty;
        private string _password = string.Empty;
        private int _role_id;
        public int Id { get => _id; set => _id = value; }
        public string Name { get => _name; set => _name = value; }
        public string Lastname { get => _lastname; set => _lastname = value; }
        public string Username { get => _username; set => _username = value; }
        public string Email { get => _email; set => _email = value; }
        public string Password { get => _password; set => _password = value; }
        public int RoleId { get => _role_id; set => _role_id = value; }
        public Roles.Roles? Roles { get; set; }


        //constructor

        public Users() { }
        public Users(int id, string name, string lastname, string username, string email, string password, int role_id)
        {
            this._id = id;
            this._name = name;
            this._lastname = lastname;
            this._username = username;
            this._email = email;
            this._password = password;
            this._role_id = role_id;
        }

        public static Users CreateFromDto(UserRegisterDto dto)
        {
            int roleId = ObtenerRoleIdPorNombre(dto.RoleName);

            return new Users
            {
                Name = dto.Name,
                Lastname = dto.Lastname,
                Username = dto.Username,
                Email = dto.Email,
                Password = dto.Password,
                RoleId = roleId
            };
        }

        public static int ObtenerOwnerIdPorNombre(string nombre)
        {
            string query = "SELECT id FROM users WHERE name = @name";
            SqlCommand cmd = new SqlCommand(query);
            cmd.Parameters.AddWithValue("@name", nombre);

            DataTable table = SqlServerConnection.EjecutarQuery(cmd);
            if (table.Rows.Count == 0)
                throw new Exception("No se encontró el usuario con nombre: " + nombre);

            return Convert.ToInt32(table.Rows[0]["id"]);
        }


        //ingresar usuarios
        public void saveUser()
        {
            string insertuser = "INSERT INTO  users (name, lastname, username, email, password, role_id) VALUES (@name, @lastname, @username, @email, @password, @role_id)";
            SqlCommand insercion = new SqlCommand(insertuser);

            insercion.Parameters.AddWithValue("@name", this.Name);
            insercion.Parameters.AddWithValue("@lastname", this.Lastname);
            insercion.Parameters.AddWithValue("@username", this.Username);
            insercion.Parameters.AddWithValue("@email", this.Email);
            insercion.Parameters.AddWithValue("@password", this.Password);
            insercion.Parameters.AddWithValue("@role_id", this.RoleId);

            SqlServerConnection.ExecuteNonQuery(insercion);
        }

        //actualizar un usuario
        public void updateUser()
        {
            string updateuser = @"UPDATE users SET = name = @name, lastname = @lastname, username = @username, email = @email, password = @password";
            SqlCommand update = new SqlCommand(updateuser);

            update.Parameters.AddWithValue("@name", this.Name);
            update.Parameters.AddWithValue("@lastname", this.Lastname);
            update.Parameters.AddWithValue("@username", this.Username);
            update.Parameters.AddWithValue("@email", this.Email);
            update.Parameters.AddWithValue("@password", this.Password);

            SqlServerConnection.ExecuteNonQuery(update);
        }
        //consultas
        public static string oneUser = @"
        select u.id, u.name as Name, u.lastname as Lastname, u.username as Username, u.email as Email, u.password as Password, u.role_id as RoleId, r.name AS RoleName
        from users u
        INNER JOIN roles r ON u.role_id = r.id
        WHERE u.id = @id";

        public static string allUser = @"
        select u.id as ID, u.name as Name, u.lastname as Lastname, u.username as Username, u.email as Email, u.password as Password, u.role_id as RoleId, r.name AS RoleName
        from users u
        INNER JOIN roles r ON u.role_id = r.id";

        //llamar consultas
        public static Users Get(int id) 
        {
            try
            {
                SqlCommand traer = new SqlCommand(oneUser);
                traer.Parameters.AddWithValue("@id", id);
                DataTable table = SqlServerConnection.EjecutarQuery(traer);

                if (table.Rows.Count > 0)
                    return UsersMapper.ConvertirAObjeto (table.Rows[0]);
            }
            catch(Exception ex) 
            {
                throw new Exception("Error al buscar usuario con id " + id + ": " + ex.Message, ex);
            }
            return null;
        }
        public static List<Users> Get()
        {
            List<Users> list = new List<Users>();
            SqlCommand cmd = new SqlCommand(allUser);
            DataTable table = SqlServerConnection.EjecutarQuery(cmd);

            foreach (DataRow row in table.Rows)
            {
                list.Add(UsersMapper.ConvertirAObjeto(row));
            }
            return list;
        }

    }
}

using connectionSqlServer;
using Microsoft.Data.SqlClient;
using System.Data;
namespace workbit.Models.Spaces
{
    public class Space
    {
        private int _id;
        private string _name = string.Empty;
        private string _location = string.Empty;
        private string _status = string.Empty;
        private int _capacity;
        private DateTime _created_at = DateTime.MinValue;

        public int Id { get => _id; set => _id = value; }
        public string Name { get => _name; set => _name = value; }
        public string Location { get => _location; set => _location = value; }
        public string Status { get => _status; set => _status = value; }
        public int Capacity { get => _capacity; set => _capacity = value; }
        public DateTime CreatedAt { get => _created_at; set => _created_at = value; }

        public Space() { }

        public Space(int id, string name, string location, string status, int capacity, DateTime created_at)
        {
            _id = id;
            _name = name;
            _location = location;
            _status = status;
            _capacity = capacity;
            _created_at = created_at;
        }

        public static int ObtenerSpaceIdPorNombre(string nombre)
        {
            string query = "SELECT id FROM spaces WHERE name = @name";
            SqlCommand cmd = new SqlCommand(query);
            cmd.Parameters.AddWithValue("@name", nombre);

            DataTable table = SqlServerConnection.EjecutarQuery(cmd);
            if (table.Rows.Count == 0)
                throw new Exception("No se encontró el espacio con nombre: " + nombre);

            return Convert.ToInt32(table.Rows[0]["id"]);
        }


        //agregar un espacio
        public void insertSpace()
        {
            string insertSpace = "INSERT INTO spaces(name, location, status, capacity) VALUES (@nema, @location, @status, @capacity)";
            SqlCommand insercion = new SqlCommand(insertSpace);

            insercion.Parameters.AddWithValue("@name", Name);
            insercion.Parameters.AddWithValue("@location", Location);
            insercion.Parameters.AddWithValue("@status", Status);
            insercion.Parameters.AddWithValue("@capacity", Capacity);

            SqlServerConnection.ExecuteNonQuery(insercion);
        }

        //actualizar un espacio
        public void updateSpace()
        {
            string updateSpace = "UPDATE spaces SET name = @name, location = @location, status = @status, capacity = @capacity WHERE id = @id";
            SqlCommand update = new SqlCommand(updateSpace);

            update.Parameters.AddWithValue("@name", Name);
            update.Parameters.AddWithValue("@location", Location);
            update.Parameters.AddWithValue("@status", Status);
            update.Parameters.AddWithValue("@capacity", Capacity);

            SqlServerConnection.ExecuteNonQuery(update);
        }

        //consultar todos los espacion
        public static  string allSpaces = @"SELECT name as Name, location as Location, status as Status, capacity as Capacity FROM spaces";


        //consultar un espacio disponible por fecha y esten disponibles
        public static string availableSpacesbyDate = @"
                SELECT s.name AS Name, s.location AS Location, s.status AS Status, s.capacity AS Capacity 
                FROM spaces s
                LEFT JOIN reservations r 
                ON s.id = r.space_id 
               AND CAST(r.start_time AS DATE) = @start_time
                WHERE s.status = 'available'
                AND r.id IS NULL;";

    }
}

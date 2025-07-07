using connectionSqlServer;
using Microsoft.Data.SqlClient;
using System;
using System.Data;
using workbit.Models.Reservations.DTO;
using workbit.Models.Spaces;
using workbit.Models.Users;
using workbit.Models.Users.DTO;

namespace workbit.Models.Reservations
{
    public class Reservations
    {
        private int _id;
        private string _reason = string.Empty;
        private DateTime _startTime = DateTime.MinValue;
        private DateTime _endTime = DateTime.MinValue;
        private string _status = "pending";
        private DateTime _reservationDate = DateTime.Now;
        private DateTime _createdAt = DateTime.Now;
        private int _space_id;
        private int _owner_id;

        public int Id { get; set; }
        public string Reason { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string Status { get; set; } = "pending";
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public int SpaceId { get => _space_id; set => _space_id = value; }
        public int OwnerId { get => _owner_id; set => _owner_id = value; }
        public Spaces.Space? Space { get; set; }
        public Users.Users? Owner { get; set; }
        public Reservations() { }

        public Reservations(int id, string reason, DateTime startTime, DateTime endTime, string status, int spaceId, int ownerId)

        {
            _id = id;
            _reason = reason;
            _startTime = startTime;
            _endTime = endTime;
            _status = status;
            _space_id = spaceId;
            _owner_id = ownerId;
        }

        public static Reservations CreateFromDto(ReservationRegisterDto dto)
        {
            int spaceId = Space.ObtenerSpaceIdPorNombre(dto.SpaceName);
            int ownerId = workbit.Models.Users.Users.ObtenerOwnerIdPorNombre(dto.OwnerName);;

            return new Reservations
            {
                Reason = dto.Reason,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                Status = string.IsNullOrWhiteSpace(dto.Status) ? "pending" : dto.Status, 
                SpaceId = spaceId,
                OwnerId = ownerId
            };
        }



        public void saveReservation()
        {
            string insertReservation = "INSERT INTO reservations(reason, start_time, end_time, status, space_id, owner_id) VALUES (@reason, @start_time, @end_time, @status, @space_id, @owner_id)";
            SqlCommand insercion = new SqlCommand(insertReservation);
            insercion.Parameters.AddWithValue("@reason", Reason);
            insercion.Parameters.AddWithValue("@start_time", StartTime);
            insercion.Parameters.AddWithValue("@end_time", EndTime);
            insercion.Parameters.AddWithValue("@status", Status);
            insercion.Parameters.AddWithValue("@space_id", SpaceId);
            insercion.Parameters.AddWithValue("@owner_id", OwnerId);
            SqlServerConnection.ExecuteNonQuery(insercion);
        }

        public static void updateStatus(int reservationId, string newStatus)
        {
            string updatestatus = @"UPDATE reservations SET status = @status WHERE id = @id";
            SqlCommand update = new SqlCommand(updatestatus);

            update.Parameters.AddWithValue("@status", newStatus);
            update.Parameters.AddWithValue("@Id", reservationId);

            SqlServerConnection.ExecuteNonQuery(update);
        }

        public static List<Reservations> Get()
        {
            string query = @"
        SELECT 
            res.id AS ID,
            res.reason AS Reason,
            res.start_time AS StartTime,
            res.end_time AS EndTime,
            res.status AS Status,
            res.space_id AS SpaceId,
            res.owner_id AS OwnerId,
            s.name AS SpaceName,
            u.name AS OwnerName
        FROM reservations res
        INNER JOIN spaces s ON res.space_id = s.id
        INNER JOIN users u ON res.owner_id = u.id";

            SqlCommand cmd = new SqlCommand(query);
            DataTable tabla = SqlServerConnection.EjecutarQuery(cmd);
            return ReservationsMapper.ConvertirLista(tabla);
        }

        public static List<Reservations> Get(DateTime start_time)
        {
            string query = @"
        SELECT 
            res.id AS ID,
            res.reason AS Reason,
            res.start_time AS StartTime,
            res.end_time AS EndTime,
            res.status AS Status,
            res.space_id AS SpaceId,
            res.owner_id AS OwnerId,
            s.name AS SpaceName,
            u.name AS OwnerName
        FROM reservations res
        INNER JOIN spaces s ON res.space_id = s.id
        INNER JOIN users u ON res.owner_id = u.id
        WHERE CAST(res.start_time AS DATE) = @start_time";

            SqlCommand cmd = new SqlCommand(query);
            cmd.Parameters.AddWithValue("@start_time", start_time.Date);

            DataTable tabla = SqlServerConnection.EjecutarQuery(cmd);
            return ReservationsMapper.ConvertirLista(tabla);
        }

        public static string oneReservation = @"
        select r.id as ID, r.reason as Reason, r.start_time as StartTime, r.end_time as EndTime, r.status as Status, r.space_id AS SpaceId,r.owner_id AS OwnerId, s.name as SpaceName, u.name as OwnerName
        from reservations r
        INNER JOIN spaces s ON r.space_id = s.id
        INNER JOIN users u ON r.owner_id = u.id
        WHERE r.id = @id";

        public static Reservations GetById(int id)
        {
            try
            {
                SqlCommand traer = new SqlCommand(oneReservation);
                traer.Parameters.AddWithValue("@id", id);
                DataTable table = SqlServerConnection.EjecutarQuery(traer);

                if (table.Rows.Count > 0)
                    return ReservationsMapper.ConvertirAObjeto(table.Rows[0]);
            }
            catch (Exception ex)
            {
                throw new Exception("Error al buscar usuario con id " + id + ": " + ex.Message, ex);
            }
            return null;
        }

    }
}

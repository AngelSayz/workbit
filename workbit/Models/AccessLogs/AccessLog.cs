using connectionSqlServer;
using Microsoft.Data.SqlClient;
using System;
using System.Data;

namespace workbit.Models.AccessLogs
{
    public class AccessLog
    {
        public int UserId { get; set; }
        public int SpaceId { get; set; }
        public int? ReservationId { get; set; }
        public DateTime AccessTime { get; set; }
        public DateTime? ExitTime { get; set; }

        public void Save()
        {
            try
            {
                string query = @"INSERT INTO access_logs(user_id, space_id, reservation_id, access_time, exit_time)
                         VALUES (@user_id, @space_id, @reservation_id, @access_time, @exit_time)";
                SqlCommand cmd = new SqlCommand(query);
                cmd.Parameters.AddWithValue("@user_id", UserId);
                cmd.Parameters.AddWithValue("@space_id", SpaceId);
                cmd.Parameters.AddWithValue("@reservation_id", (object?)ReservationId ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@access_time", AccessTime);
                cmd.Parameters.AddWithValue("@exit_time", (object?)ExitTime ?? DBNull.Value);

                Console.WriteLine($"Saving access: U:{UserId}, S:{SpaceId}, R:{ReservationId}, A:{AccessTime}, E:{ExitTime}");

                SqlServerConnection.ExecuteNonQuery(cmd);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error en Save(): " + ex.Message);
                throw; // relanza para que llegue al controlador
            }
        }

        public static (List<string> hours, List<int> totals) GetHourlyAccessTotals(DateTime date)
        {
            string query = @"
        SELECT 
            DATEPART(HOUR, access_time) AS hour,
            COUNT(*) AS total
        FROM access_logs
        WHERE CAST(access_time AS DATE) = @date
        GROUP BY DATEPART(HOUR, access_time)
        ORDER BY hour;";

            SqlCommand cmd = new SqlCommand(query);
            cmd.Parameters.AddWithValue("@date", date.Date);

            DataTable table = SqlServerConnection.EjecutarQuery(cmd);

            List<string> hours = new List<string>();
            List<int> totals = new List<int>();

            foreach (DataRow row in table.Rows)
            {
                int hour = Convert.ToInt32(row["hour"]);
                hours.Add(hour.ToString("D2")); // formato 09, 10, 11...
                totals.Add(Convert.ToInt32(row["total"]));
            }

            return (hours, totals);
        }

        public static object GetHourlyAccess(DateTime date)
        {
            string query = @"
            SELECT DATEPART(HOUR, access_time) AS hour, COUNT(*) AS total
            FROM access_logs
            WHERE CAST(access_time AS DATE) = @date
            GROUP BY DATEPART(HOUR, access_time)
            ORDER BY hour";

            SqlCommand cmd = new SqlCommand(query);
            cmd.Parameters.AddWithValue("@date", date.Date);

            DataTable table = SqlServerConnection.EjecutarQuery(cmd);

            var hours = new List<string>();
            var totals = new List<int>();

            for (int h = 6; h <= 20; h++)
            {
                hours.Add($"{h:00}:00");

                DataRow? row = table.Rows
                    .Cast<DataRow>()
                    .FirstOrDefault(r => Convert.ToInt32(r["hour"]) == h);

                if (row != null)
                    totals.Add(Convert.ToInt32(row["total"]));
                else
                    totals.Add(0);
            }

            return new
            {
                date = date.ToString("yyyy-MM-dd"),
                hour = hours,
                totals = totals
            };
        }
    }
}

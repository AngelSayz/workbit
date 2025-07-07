using System;
using System.Collections.Generic;
using System.Data;
using workbit.Models.Spaces;
using workbit.Models.Users;
using workbit.Models.Reservations;
using Microsoft.Data.SqlClient;

namespace workbit.Models.Reservations
{
    public class ReservationsMapper
    {
        public static Reservations ConvertirAObjeto(DataRow fila)
        {
            int id = Convert.ToInt32(fila["ID"]);
            string reason = fila["Reason"]?.ToString() ?? string.Empty;
            DateTime start_time = fila["StartTime"] is DBNull ? DateTime.MinValue : Convert.ToDateTime(fila["StartTime"]);
            DateTime end_time = fila["EndTime"] is DBNull ? DateTime.MinValue : Convert.ToDateTime(fila["EndTime"]);
            string status = fila["Status"]?.ToString() ?? string.Empty;
            int spaceId = Convert.ToInt32(fila["SpaceId"]);
            int ownerId = Convert.ToInt32(fila["OwnerId"]);

            // Crear objeto usuario con constructor
            Reservations reservations = new Reservations
            {
                Id = id,
                Reason = reason,
                StartTime = start_time,
                EndTime = end_time,
                Status = status,
                SpaceId = spaceId,
                OwnerId = ownerId,
                CreatedAt = fila.Table.Columns.Contains("CreatedAt") && fila["CreatedAt"] != DBNull.Value
        ? Convert.ToDateTime(fila["CreatedAt"])
        : DateTime.Now
            };


            // Asignar el objeto de rol si existe el campo "RoleName"
            if (fila.Table.Columns.Contains("SpaceName"))
            {
                reservations.Space = new Spaces.Space
                {
                    Id = spaceId,
                    Name = fila["SpaceName"]?.ToString() ?? string.Empty
                };
            }

            if (fila.Table.Columns.Contains("OwnerName"))
            {
                reservations.Owner = new Users.Users
                {
                    Id = ownerId,
                    Name = fila["OwnerName"]?.ToString() ?? string.Empty
                };
            }

            return reservations;
        }

        public static List<Reservations> ConvertirLista(DataTable tabla)
        {
            List<Reservations> list = new List<Reservations>();
            foreach (DataRow fila in tabla.Rows)
            {
                list.Add(ConvertirAObjeto(fila));
            }
            return list;
        }
    }
}

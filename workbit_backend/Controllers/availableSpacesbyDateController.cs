using Microsoft.AspNetCore.Mvc;
using workbit.Models.Spaces;
using Microsoft.Data.SqlClient;
using connectionSqlServer;
using System;
using System.Collections.Generic;
using System.Data;

namespace workbit.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AvailableSpacesController : ControllerBase
    {
        [HttpGet("{date}")]
        public IActionResult GetAvailableSpacesByDate(string date)
        {
            try
            {
                if (!DateTime.TryParse(date, out DateTime parsedDate))
                    return BadRequest("Formato de fecha inválido. Usa yyyy-MM-dd");

                List<Space> availableSpaces = new List<Space>();

                SqlCommand cmd = new SqlCommand(Space.availableSpacesbyDate);
                cmd.Parameters.AddWithValue("@start_time", parsedDate.Date);

                DataTable resultTable = SqlServerConnection.EjecutarQuery(cmd);

                foreach (DataRow row in resultTable.Rows)
                {
                    Space s = new Space
                    {
                        // Asignación basada en alias del SELECT
                        Name = row["Name"].ToString() ?? "",
                        Location = row["Location"].ToString() ?? "",
                        Status = row["Status"].ToString() ?? "",
                        Capacity = Convert.ToInt32(row["Capacity"])
                    };

                    availableSpaces.Add(s);
                }

                return Ok(availableSpaces);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al consultar espacios disponibles", error = ex.Message });
            }
        }
    }
}

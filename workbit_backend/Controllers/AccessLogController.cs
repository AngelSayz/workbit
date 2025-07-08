using Microsoft.AspNetCore.Mvc;
using workbit.Models.AccessLogs;
using workbit.Models.AccessLogs.DTO;

namespace workbit.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccessLogController : ControllerBase
    {
        [HttpPost]
        public IActionResult Post([FromBody] AccessLogDto dto)
        {
            try
            {
                if (dto == null)
                    return BadRequest(new { message = "Datos inválidos" });

                AccessLog log = new AccessLog
                {
                    UserId = dto.User_Id,
                    SpaceId = dto.Space_Id,
                    ReservationId = dto.Reservation_Id,
                    AccessTime = dto.Access_Time,
                    ExitTime = dto.Exit_Time
                };

                log.Save(); // tu método que guarda en la base de datos

                return Ok(new { message = "Acceso registrado" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error interno",
                    detalle = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }

        }

        [HttpGet("accesslog/hourly/{date}")]
        public IActionResult GetAccessStats(string date)
        {
            DateTime parsedDate = DateTime.Parse(date);
            var (hours, totals) = AccessLog.GetHourlyAccessTotals(parsedDate);

            return Ok(new
            {
                date = parsedDate.ToString("yyyy-MM-dd"),
                hour = hours,
                totals = totals
            });
        }

        [HttpGet("hourly/{date}")]
        public IActionResult GetHourlyAccess(string date)
        {
            DateTime parsedDate;
            if (!DateTime.TryParse(date, out parsedDate))
                return BadRequest("Invalid date format");

            var data = AccessLog.GetHourlyAccess(parsedDate); // <- tu método con consulta SQL
            return Ok(data);
        }

    }
}

using connectionSqlServer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System;
using System.Collections.Generic;
using System.Data;
using workbit.MessagesTypes;
using workbit.Models.AccessLogs;
using workbit.Models.Reservations;
using workbit.Models.Reservations.DTO;
using workbit.Models.Roles;
using workbit.Models.Spaces;
using workbit.Models.Users;
using workbit.Models.Users.DTO;
using workbit.ViewModels;


namespace workbit.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReservationsController : ControllerBase
    {
        [HttpGet]
        [Route("")]
        public ActionResult Get()
        {
            try
            {
                List<Reservations> reservations = Reservations.Get();
                return Ok(ReservationsListResponse.Respuesta());

            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error to found reservations: {ex.Message}");
            }
        }

        [HttpGet]
        [Route("{start_time}")]
        public ActionResult Get(DateTime start_time)
        {
            try
            {
                List<Reservations> reservations = Reservations.Get(start_time);
                if (reservations == null || reservations.Count == 0)
                {
                    return StatusCode(404, MessageResponse.Respuesta(1, "No reservations found for the given date", MessageReservation.Error));
                }
                return Ok(ReservationsListResponseWithParameters.Respuesta(reservations));
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error to found reservations: {ex.Message}");
            }
        }


        [HttpGet("{id:int}")]
        public ActionResult GetById(int id)
        {
            try
            {
                var res = Reservations.GetById(id); // <-- Aquí se obtiene el modelo completo
                if (res == null)
                    return NotFound(MessageResponse.Respuesta(1, "Reservation not found", MessageReservation.Error));

                // Aquí convertimos a DTO para no exponer propiedades internas como SpaceId, OwnerId, etc.
                var dto = new ReservationsResponseDto
                {
                    Id = res.Id,
                    Reason = res.Reason,
                    StartTime = res.StartTime,
                    EndTime = res.EndTime,
                    Status = res.Status,
                    SpaceName = res.Space?.Name ?? "",
                    OwnerName = res.Owner?.Name ?? "",
                    CreatedAt = res.CreatedAt
                };

                return Ok(dto); // <-- Solo se devuelve lo que el frontend necesita
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al buscar reserva con id {id}: {ex.Message}");
            }
        }


        [HttpPost]
        [Route("createResevation")]
        public ActionResult PostReservation([FromForm] ReservationRegisterDto dto)
        {
            try
            {
                if (dto == null)
                {
                    return BadRequest(MessageResponse.Respuesta(1, "Reservation data cannot be null", MessageReservation.Error));
                }
                int spaceId = Space.ObtenerSpaceIdPorNombre(dto.SpaceName);
                int OwnerId = Users.ObtenerOwnerIdPorNombre(dto.OwnerName);
                // obtiene el id real del rol

                Reservations newReservation = new Reservations
                {
                    Reason = dto.Reason,
                    StartTime = dto.StartTime,
                    EndTime = dto.EndTime,
                    Status = dto.Status,
                    SpaceId = spaceId,
                    OwnerId = OwnerId
                };
                newReservation.saveReservation();
                return Ok(MessageResponse.Respuesta(0, "Reservation created successfully", MessageReservation.Success));
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error to create reservation: {ex.Message}");
            }
        }

        [HttpPost]
        [Route("update")]
        public ActionResult UpdateStatus([FromForm] ReservationStatusUpdateDto updateStatus )
        {
            try
            {
                if (updateStatus == null)
                    return BadRequest(MessageResponse.Respuesta(1, "Reservation cannot be null", MessageReservation.Error));

                Reservations.updateStatus(updateStatus.Id, updateStatus.Status);

                return Ok(MessageResponse.Respuesta(0, "Reservation status updated successfully", MessageReservation.Success));
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al actualizar usuario: {ex.Message}");
            }
        }

        //eliminar cuando no use el simulador
        [HttpPost("simulate")]
        public ActionResult SimulateReservation([FromBody] ReservationRegisterDto dto)
        {
            try
            {
                if (dto == null)
                    return BadRequest(MessageResponse.Respuesta(1, "Datos nulos", MessageReservation.Error));

                // Validación básica
                int spaceId = Space.ObtenerSpaceIdPorNombre(dto.SpaceName);
                int ownerId = Users.ObtenerOwnerIdPorNombre(dto.OwnerName);
                if (spaceId == -1 || ownerId == -1)
                    return BadRequest(MessageResponse.Respuesta(1, "Espacio o dueño no válido", MessageReservation.Error));

                var reserva = new Reservations
                {
                    Reason = dto.Reason,
                    StartTime = dto.StartTime,
                    EndTime = dto.EndTime,
                    Status = dto.Status,
                    SpaceId = spaceId,
                    OwnerId = ownerId
                };
                reserva.saveReservation();
                return Ok(MessageResponse.Respuesta(0, "Reserva simulada creada correctamente", MessageReservation.Success));
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error en simulación de reserva: {ex.Message}");
            }
        }

        [HttpGet("totals/{date}")]
        public ActionResult GetTotals(string date)
        {
            try
            {
                if (!DateTime.TryParse(date, out DateTime fecha))
                    return BadRequest("Fecha inválida.");

                var result = new
                {
                    date = fecha.ToString("yyyy-MM-dd"),
                    hour = Enumerable.Range(0, 24).Select(h => h.ToString("D2") + ":00").ToArray(),
                    totals = new int[24],
                    minutes = Enumerable.Range(0, 60).Select(m => m.ToString("D2")).ToArray(),
                    usage = new int[60]
                };

                string query = @"
            SELECT 
                DATEPART(HOUR, start_time) as hour,
                COUNT(*) as total
            FROM reservations
            WHERE CAST(start_time AS DATE) = @fecha
            GROUP BY DATEPART(HOUR, start_time)
        ";

                SqlCommand cmd = new SqlCommand(query);
                cmd.Parameters.AddWithValue("@fecha", fecha.Date);
                var tabla = SqlServerConnection.EjecutarQuery(cmd);

                foreach (DataRow row in tabla.Rows)
                {
                    int hour = Convert.ToInt32(row["hour"]);
                    int total = Convert.ToInt32(row["total"]);
                    if (hour >= 0 && hour < 24)
                        result.totals[hour] = total;
                }

                // También puedes generar usage por minuto si lo deseas (opcionalmente real)

                return Ok(new
                {
                    date = result.date,
                    hour = result.hour,
                    totals = result.totals,
                    minutes = result.minutes,
                    totals_minutes = result.usage
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al obtener estadísticas: {ex.Message}");
            }
        }

        [HttpGet("reservations/hourly/{date}")]
        public IActionResult GetReservationStats(string date)
        {
            DateTime parsedDate = DateTime.Parse(date);
            var (hours, totals) = Reservations.GetHourlyTotals(parsedDate);

            return Ok(new
            {
                date = parsedDate.ToString("yyyy-MM-dd"),
                hour = hours,
                totals = totals
            });
        }

        [HttpGet("hourly/{date}")]
        public IActionResult GetHourlyReservations(string date)
        {
            DateTime parsedDate;
            if (!DateTime.TryParse(date, out parsedDate))
                return BadRequest("Invalid date format");

            var data = Reservations.GetHourlyData(parsedDate); // <- tu método con consulta SQL
            return Ok(data);
        }



    }
}

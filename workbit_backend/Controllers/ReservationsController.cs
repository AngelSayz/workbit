using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using workbit.MessagesTypes;
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
    }
}

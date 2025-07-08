using System;
using System.Collections.Generic;
using workbit.ViewModels;
using workbit.Models.Reservations;

namespace workbit.Models.Reservations
{
    public class ReservationsListResponse : JsonResponse
    {
        public List<Reservations> reservations { get; set; } = new();

        public static ReservationsListResponse Respuesta()
        {
            ReservationsListResponse respuesta = new ReservationsListResponse();
            respuesta.StatusCode = 0;
            respuesta.reservations = Reservations.Get();

            return respuesta;
        }
    }
}

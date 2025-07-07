using System;
using System.Collections.Generic;
using workbit.ViewModels;
using workbit.Models.Reservations;

namespace workbit.Models.Reservations
{
    public class ReservationsListResponseWithParameters : JsonResponse
    {
        public List<Reservations> reservations { get; set; } = new();
        public static ReservationsListResponseWithParameters Respuesta(List<Reservations> lista)
        {
            return new ReservationsListResponseWithParameters
            {
                StatusCode = 0,
                reservations = lista
            };
        }
    }
}

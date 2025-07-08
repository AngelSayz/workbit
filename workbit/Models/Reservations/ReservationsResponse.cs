using workbit.ViewModels;

namespace workbit.Models.Reservations
{
    public class ReservationsResponse : JsonResponse
    {
        public Reservations Reservation { get; set; }
        public static ReservationsResponse Respuesta(Reservations reservation)
        {
            ReservationsResponse response = new ReservationsResponse();
            response.StatusCode = 0;
            response.Reservation = reservation;
            return response;
        }
    }
}

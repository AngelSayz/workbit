namespace workbit.Models.Reservations.DTO
{
    public class ReservationStatusUpdateDto
    {
        public int Id { get; set; }
        public string Status { get; set; } = "pending";
    }
}

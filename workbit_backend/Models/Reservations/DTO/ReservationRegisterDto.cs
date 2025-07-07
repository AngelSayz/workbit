namespace workbit.Models.Reservations.DTO
{
    public class ReservationRegisterDto
    {
        public string Reason { get; set; } = string.Empty;
        public DateTime StartTime { get; set; } = DateTime.MinValue;
        public DateTime EndTime { get; set; } = DateTime.MinValue;
        public string SpaceName { get; set; } = string.Empty;
        public string OwnerName { get; set; } = string.Empty;
        public string Status { get; set; } = "pending";
        public DateTime CreatedAt { get; set; } = DateTime.Now;

    }
}

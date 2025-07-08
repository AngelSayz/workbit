namespace workbit.Models.Reservations.DTO
{
    public class ReservationsResponseDto
    {
        public int Id { get; set; }
        public string Reason { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string Status { get; set; } = "pending";
        public string SpaceName { get; set; } = string.Empty;
        public string OwnerName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}

namespace workbit.Models.AccessLogs.DTO
{
    public class AccessLogDto
    {
        public int User_Id { get; set; }
        public int Space_Id { get; set; }
        public int? Reservation_Id { get; set; }
        public DateTime Access_Time { get; set; }
        public DateTime? Exit_Time { get; set; }
    }
}

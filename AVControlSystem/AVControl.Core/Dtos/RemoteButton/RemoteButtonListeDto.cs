namespace AVControl.Core.Dtos.RemoteButtonDtos
{
    public class RemoteButtonListeDto
    {
        public int Id { get; set; }
        public int RemoteControlId { get; set; }
        public string? KumandaMarkaModel { get; set; } // Admin tablosunda Hangi kumanda olduğunu görmek için
        public required string TusKodu { get; set; }
        public string? RawDataJson { get; set; }
        public bool AktifMi { get; set; }
    }
}
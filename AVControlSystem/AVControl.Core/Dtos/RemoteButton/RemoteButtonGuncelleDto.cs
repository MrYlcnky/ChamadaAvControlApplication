namespace AVControl.Core.Dtos.RemoteButtonDtos
{
    public class RemoteButtonGuncelleDto
    {
        public int Id { get; set; }
        public int RemoteControlId { get; set; }
        public string? KumandaMarkaModel { get; set; }
        public required string TusKodu { get; set; }
        public string? RawDataJson { get; set; }
        public bool AktifMi { get; set; }
    }
}
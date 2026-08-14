namespace AVControl.Core.Dtos.RemoteButtonDtos
{
    public class RemoteButtonEkleDto
    {
        public int RemoteControlId { get; set; }
        public string? KumandaMarkaModel { get; set; }
        public required string TusKodu { get; set; }
        public string? RawDataJson { get; set; }
        public bool AktifMi { get; set; }
    }
}
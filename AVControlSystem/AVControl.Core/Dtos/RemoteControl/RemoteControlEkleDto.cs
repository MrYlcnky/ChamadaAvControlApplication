namespace AVControl.Core.Dtos.RemoteControlDtos
{
    public class RemoteControlEkleDto
    {
        public required string CihazTipi { get; set; }
        public required string KumandaMarkaModel { get; set; }
        public string? ProtokolTipi { get; set; }
        public bool AktifMi { get; set; }
    }
}
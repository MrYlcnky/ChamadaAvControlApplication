namespace AVControl.Core.Dtos.ChannelListDtos
{
    public class ChannelListEkleDto
    {
        public int InputSourceId { get; set; }
        public int KanalNumarasi { get; set; }
        public required string KanalAdi { get; set; }
        public string? LogoUrl { get; set; }
        public bool KullanicidaGosterilsinMi { get; set; }
        public bool AktifMi { get; set; }
    }
}
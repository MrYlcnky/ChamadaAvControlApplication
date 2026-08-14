namespace AVControl.Core.Dtos.ChannelListDtos
{
    public class ChannelListListeDto
    {
        public int Id { get; set; }
        public int InputSourceId { get; set; }

        public string? KaynakAdi { get; set; } // Örn: Digiturk 1
        public string? MatrixCihazAdi { get; set; } // Örn: Gefen Matrix
        public string? PiCihazAdi { get; set; } // Örn: Sistem Odası Pi
        public string? KumandaAdi { get; set; } // Örn: Digiturk Plus Kumanda

        public int KanalNumarasi { get; set; }
        public required string KanalAdi { get; set; }
        public string? LogoUrl { get; set; }
        public bool KullanicidaGosterilsinMi { get; set; }
        public bool AktifMi { get; set; }
    }
}
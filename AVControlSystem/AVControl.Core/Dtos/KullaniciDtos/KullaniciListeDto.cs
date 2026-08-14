using AVControl.Core.Enums;

namespace AVControl.Core.Dtos.KullaniciDtos
{
    public class KullaniciListeDto
    {
        public int Id { get; set; }
        public string? Ad { get; set; }
        public string? Soyad { get; set; }
        public required string KullaniciAdi { get; set; }
        public KullaniciRolu Rol { get; set; }
        public string? Sifre { get; set; }
        public int? PinKodu { get; set; }
        public bool AktifMi { get; set; }
    }
}
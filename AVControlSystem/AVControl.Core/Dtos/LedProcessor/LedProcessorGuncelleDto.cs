using Microsoft.AspNetCore.Http;

namespace AVControl.Core.Dtos.LedProcessorDtos
{
    public class LedProcessorGuncelleDto
    {
        public int Id { get; set; }
        public required string CihazAdi { get; set; }
        public required string IpAdresi { get; set; }
        public int Port { get; set; }
        public string? MacAdresi { get; set; }
        public bool AktifMi { get; set; }
        public bool KullanicidaGosterilsinMi { get; set; }
        public IFormFile? GorselDosyasi { get; set; }
        public bool ViplexKontroluVarMi { get; set; }

        public string? CihazMarka { get; set; } // Örn: "Novastar", "Brompton"
        public string? SeriNo { get; set; }     // Novastar API için gerekli (sn)
        public string? KullaniciAdi { get; set; } // Örn: "admin"
        public string? Sifre { get; set; }        // Örn: "SN2008@+"
    }
}
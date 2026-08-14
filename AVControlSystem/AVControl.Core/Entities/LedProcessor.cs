namespace AVControl.Core.Entities
{
    public class LedProcessor : BaseEntity
    {
        public required string CihazAdi { get; set; }
        public required string IpAdresi { get; set; }
        public int Port { get; set; }
        public string? MacAdresi { get; set; }
        public bool KullanicidaGosterilsinMi { get; set; }

        public ICollection<OutputZone>? OutputZones { get; set; }

        public bool ViplexKontroluVarMi { get; set; }
        public string? CihazGorselUrl { get; set; }

        public string? CihazMarka { get; set; } // Örn: "Novastar", "Brompton"
        public string? SeriNo { get; set; }     // Novastar API için gerekli (sn)
        public string? KullaniciAdi { get; set; } // Örn: "admin"
        public string? Sifre { get; set; }        // Örn: "SN2008@+"
    }
}
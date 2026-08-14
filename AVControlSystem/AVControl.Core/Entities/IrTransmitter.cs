namespace AVControl.Core.Entities
{
    public class IrTransmitter : BaseEntity
    {
        public required string CihazAdi { get; set; } // Örn: "Sistem Odası Pi"
        public required string IpAdresi { get; set; } // Örn: "192.168.1.100"
        public string? MacAdresi { get; set; }

        public ICollection<InputSource>? InputSources { get; set; }
        public string? CihazGorselUrl { get; set; }
    }
}
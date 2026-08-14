namespace AVControl.Core.Entities
{
    public class MatrixDevice : BaseEntity
    {
        public required string CihazAdi { get; set; }
        public required string IpAdresi { get; set; }
        public int TelnetPort { get; set; }
        public string? MacAdresi { get; set; }
        public int InputSayisi { get; set; }
        public int OutputSayisi { get; set; }
        public string? CihazGorselUrl { get; set; }

        public ICollection<InputSource>? InputSources { get; set; }
        public ICollection<OutputZone>? OutputZones { get; set; }
    }
}
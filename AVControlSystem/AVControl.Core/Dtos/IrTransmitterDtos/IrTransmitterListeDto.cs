namespace AVControl.Core.Dtos.IrTransmitterDtos
{
    public class IrTransmitterListeDto
    {
        public int Id { get; set; }
        public required string CihazAdi { get; set; }
        public required string IpAdresi { get; set; }
        public string? MacAdresi { get; set; }
        public bool AktifMi { get; set; }
        public string? CihazGorselUrl { get; set; }
    }
}
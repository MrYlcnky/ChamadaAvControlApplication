using Microsoft.AspNetCore.Http;

namespace AVControl.Core.Dtos.IrTransmitterDtos
{
    public class IrTransmitterEkleDto
    {
        public required string CihazAdi { get; set; }
        public required string IpAdresi { get; set; }
        public string? MacAdresi { get; set; }
        public bool AktifMi { get; set; }
        public IFormFile? GorselDosyasi { get; set; }
    }
}
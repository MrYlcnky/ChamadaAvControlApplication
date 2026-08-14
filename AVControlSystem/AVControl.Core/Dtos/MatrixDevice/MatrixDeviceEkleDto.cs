using Microsoft.AspNetCore.Http;

namespace AVControl.Core.Dtos.MatrixDeviceDtos
{
    public class MatrixDeviceEkleDto
    {
        public required string CihazAdi { get; set; }
        public required string IpAdresi { get; set; }
        public int TelnetPort { get; set; }
        public string? MacAdresi { get; set; }
        public int InputSayisi { get; set; }
        public int OutputSayisi { get; set; }
        public bool AktifMi { get; set; }
        public IFormFile? GorselDosyasi { get; set; }
    }
}
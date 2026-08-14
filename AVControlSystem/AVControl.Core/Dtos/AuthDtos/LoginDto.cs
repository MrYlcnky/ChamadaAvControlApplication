namespace AVControl.Core.DTOs.AuthDtos
{
    public class LoginDto
    {
        public required string KullaniciAdi { get; set; }
        public required string Sifre { get; set; }
    }
}
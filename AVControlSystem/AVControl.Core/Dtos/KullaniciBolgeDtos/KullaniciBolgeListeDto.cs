namespace AVControl.Core.Dtos.KullaniciBolgeDtos
{
    public sealed class KullaniciBolgeListeDto
    {
        public int Id { get; set; }
        public string BolgeAdi { get; set; } = string.Empty;
        public int MatrixDeviceId { get; set; }
        public string PortKodu { get; set; } = string.Empty;
    }
}

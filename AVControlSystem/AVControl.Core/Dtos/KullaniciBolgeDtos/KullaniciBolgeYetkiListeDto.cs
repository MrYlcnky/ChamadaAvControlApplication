namespace AVControl.Core.Dtos.KullaniciBolgeDtos
{
    public sealed class KullaniciBolgeYetkiListeDto
    {
        public int KullaniciId { get; set; }
        public List<int> BolgeIds { get; set; } = new();
    }
}

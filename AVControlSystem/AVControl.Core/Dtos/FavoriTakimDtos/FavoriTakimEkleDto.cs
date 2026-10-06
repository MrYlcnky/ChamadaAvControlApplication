namespace AVControl.Core.Dtos.FavoriTakim
{
    public class FavoriTakimEkleDto
    {
        public required string TakimAdi { get; set; }

        public bool AktifMi { get; set; }

        public List<string> Ligler { get; set; } = new();
    }
}
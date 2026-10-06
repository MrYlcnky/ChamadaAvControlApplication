namespace AVControl.Core.Dtos.FavoriTakim
{
    public class FavoriTakimGuncelleDto
    {
        public int Id { get; set; }

        public required string TakimAdi { get; set; }

        public bool AktifMi { get; set; }

        public List<string> Ligler { get; set; } = new();
    }
}
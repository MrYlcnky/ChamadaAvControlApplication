namespace AVControl.Core.Dtos.MacTakvimDtos
{
    public class MacTakvimEkleDto
    {
        public required string ExternalId { get; set; }
        public DateTime MacTarihi { get; set; }
        public required string EvSahibi { get; set; }
        public required string Deplasman { get; set; }
        public required string LigAdi { get; set; }
        public string? YayinKanali { get; set; }
        public string? Skor { get; set; }
        public string? Durum { get; set; }
        public bool AktifMi { get; set; } 
    }
}
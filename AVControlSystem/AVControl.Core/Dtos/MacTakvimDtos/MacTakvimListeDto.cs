namespace AVControl.Core.Dtos.MacTakvimDtos
{
    public class MacTakvimListeDto
    {
        public int Id { get; set; }
        public DateTime MacTarihi { get; set; }
        public string? EvSahibi { get; set; }
        public string? Deplasman { get; set; }
        public string? LigAdi { get; set; }
        public string? YayinKanali { get; set; }
        public string? Skor { get; set; }
        public string? Durum { get; set; }
        public bool AktifMi { get; set; }
    }
}
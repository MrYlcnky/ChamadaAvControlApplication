namespace AVControl.Core.Entities
{
    public class MacTakvim : BaseEntity
    {
        public string ExternalId { get; set; } // API'den gelen benzersiz ID (Örn: Maçkolik ID)
        public DateTime MacTarihi { get; set; }
        public string EvSahibi { get; set; }
        public string Deplasman { get; set; }
        public string LigAdi { get; set; }
        public string YayinKanali { get; set; }
        public string Skor { get; set; } // "0-0" gibi
        public string Durum { get; set; } // "Canlı", "Başlamadı", "Bitti"
    }
}
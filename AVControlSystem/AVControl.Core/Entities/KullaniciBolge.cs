namespace AVControl.Core.Entities
{
    // Kullanıcı ile kontrol edebileceği bölge arasındaki ilişki.
    public class KullaniciBolge
    {
        public int Id { get; set; }

        public int KullaniciId { get; set; }
        public int OutputZoneId { get; set; }

        public Kullanici? Kullanici { get; set; }
        public OutputZone? OutputZone { get; set; }
    }
}

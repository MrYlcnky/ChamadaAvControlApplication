using AVControl.Core.Enums;

namespace AVControl.Core.Entities
{
    public class Kullanici : BaseEntity
    {
        public string? Ad { get; set; }
        public string? Soyad { get; set; }
        public required string KullaniciAdi { get; set; }
        public required string SifreHash { get; set; }
        public int? PinKodu { get; set; }
        public KullaniciRolu Rol { get; set; }

        public ICollection<IslemLog>? IslemLoglari { get; set; }
    }
}
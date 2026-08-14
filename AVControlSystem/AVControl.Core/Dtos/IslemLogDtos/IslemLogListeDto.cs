using System;

namespace AVControl.Core.Dtos.IslemLogDtos
{
    public class IslemLogListeDto
    {
        public int Id { get; set; }
        public int KullaniciId { get; set; }
        public string? KullaniciAdSoyad { get; set; } // Arayüzde "Kullanıcı ID: 5" yerine "Mehmet Yalçınkaya" yazması için
        public string? IslemTipi { get; set; }
        public string? Detaylar { get; set; }
        public DateTime OlusturulmaTarihi { get; set; }
    }
}
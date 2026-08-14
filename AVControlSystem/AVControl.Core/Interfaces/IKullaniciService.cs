using AVControl.Core.Entities;

namespace AVControl.Core.Interfaces
{
    public interface IKullaniciService : IService<Kullanici>
    {
        Task<Kullanici?> KimlikDogrulaAsync(string kullaniciAdi, string sifre);
        Task<bool> KullaniciAdiKullanimdaMiAsync(string kullaniciAdi);
        Task<Kullanici?> KioskKimlikDogrulaAsync(int pinKodu);
    }
}

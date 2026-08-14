using AVControl.Core.Entities;
using AVControl.Core.Interfaces;

namespace AVControl.Service.Services
{
    public class KullaniciService : GenericService<Kullanici>, IKullaniciService
    {
        private readonly IGenericRepository<Kullanici> _kullaniciRepository;

        // Base (GenericService) sınıfının ihtiyaç duyduğu repository ve unitOfWork'ü gönderiyoruz
        public KullaniciService(IGenericRepository<Kullanici> repository, IUnitOfWork unitOfWork)
            : base(repository, unitOfWork)
        {
            _kullaniciRepository = repository;
        }

        public async Task<bool> KullaniciAdiKullanimdaMiAsync(string kullaniciAdi)
        {
            var kullanicilar = await _kullaniciRepository.KosulaGoreGetirAsync(x => x.KullaniciAdi == kullaniciAdi);
            return kullanicilar.Any();
        }

        public async Task<Kullanici?> KimlikDogrulaAsync(string kullaniciAdi, string sifre)
        {
            // Önce kullanıcı adından aktif olan kişiyi bul
            var kullanicilar = await _kullaniciRepository.KosulaGoreGetirAsync(x => x.KullaniciAdi == kullaniciAdi && x.AktifMi);
            var kullanici = kullanicilar.FirstOrDefault();

            if (kullanici == null)
                return null;

            // Bulunan kullanıcının hash'li şifresi ile dışarıdan gelen şifreyi BCrypt ile karşılaştır
            bool sifreDogruMu = BCrypt.Net.BCrypt.Verify(sifre, kullanici.SifreHash);

            return sifreDogruMu ? kullanici : null;
        }

        // Kiosk (Pin-Pad) için yeni eklenen metot
        public async Task<Kullanici?> KioskKimlikDogrulaAsync(int pinKodu)
        {
            // Girilen PIN koduna sahip ve hesabı aktif olan kullanıcıyı getir
            var kullanicilar = await _kullaniciRepository.KosulaGoreGetirAsync(x => x.PinKodu == pinKodu && x.AktifMi);

            // Eğer varsa ilkini (zaten 1 tane olmalı), yoksa null dön
            return kullanicilar.FirstOrDefault();
        }
    }
}
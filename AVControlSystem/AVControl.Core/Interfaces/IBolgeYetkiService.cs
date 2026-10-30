using AVControl.Core.Dtos.KullaniciBolgeDtos;
using System.Security.Claims;

namespace AVControl.Core.Interfaces
{
    public interface IBolgeYetkiService
    {
        // Calisan kontrol paneli ve cihaz komutlarinin yetkilendirilmesi.
        Task<HashSet<int>> YetkiliBolgeIdleriAsync(ClaimsPrincipal user);
        Task<bool> BolgeYetkisiVarMiAsync(ClaimsPrincipal user, int outputZoneId);
        Task<bool> TumBolgelereYetkiliMiAsync(ClaimsPrincipal user, IEnumerable<int> outputZoneIds);
        Task<bool> LedIslemciYetkisiVarMiAsync(ClaimsPrincipal user, int ledProcessorId);

        // Yonetici tarafindaki bolge atama islemleri.
        // kullaniciId verilmezse geriye donuk uyumluluk icin normal
        // kullaniciya atanabilecek bolgeler listelenir.
        Task<List<KullaniciBolgeListeDto>> SecilebilirBolgeleriGetirAsync(int? kullaniciId = null);
        Task<bool> KullaniciVarMiAsync(int kullaniciId);
        Task<List<int>> KullaniciBolgeIdleriGetirAsync(int kullaniciId);
        Task<bool> AtanabilirBolgeIdleriGecerliMiAsync(int kullaniciId, IReadOnlyCollection<int> outputZoneIds);
        Task KullaniciBolgeleriniKaydetAsync(int kullaniciId, IReadOnlyCollection<int> outputZoneIds);
    }
}

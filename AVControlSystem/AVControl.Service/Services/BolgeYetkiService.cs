using AVControl.Core.Dtos.KullaniciBolgeDtos;
using AVControl.Core.Entities;
using AVControl.Core.Enums;
using AVControl.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AVControl.Service.Services
{
  
    public sealed class BolgeYetkiService : IBolgeYetkiService
    {
        private readonly IGenericRepository<KullaniciBolge> _yetkiRepo;
        private readonly IGenericRepository<OutputZone> _bolgeRepo;
        private readonly IGenericRepository<Kullanici> _kullaniciRepo;
        private readonly IUnitOfWork _unitOfWork;

        public BolgeYetkiService(
            IGenericRepository<KullaniciBolge> yetkiRepo,
            IGenericRepository<OutputZone> bolgeRepo,
            IGenericRepository<Kullanici> kullaniciRepo,
            IUnitOfWork unitOfWork)
        {
            _yetkiRepo = yetkiRepo;
            _bolgeRepo = bolgeRepo;
            _kullaniciRepo = kullaniciRepo;
            _unitOfWork = unitOfWork;
        }

        private static bool IsAdmin(ClaimsPrincipal user) =>
            user.Identity?.IsAuthenticated == true &&
            (user.IsInRole("Admin") || user.IsInRole("1"));

        private static int? AuthenticatedId(ClaimsPrincipal user)
        {
            if (user.Identity?.IsAuthenticated != true)
                return null;

            string? idText = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                          ?? user.FindFirst("sub")?.Value;

            return int.TryParse(idText, out int id) && id > 0 ? id : null;
        }

        // Bu kurali hem atama, hem listeleme, hem de komut erisiminde kullaniyoruz.
        // LED'ye bagli olmayan bolgeler eski sistemdeki gibi genel olarak gorunebilir.
        private IQueryable<OutputZone> NormalKullaniciyaAcikBolgeler()
        {
            return _bolgeRepo.GetAll().AsNoTracking().Where(z =>
                z.AktifMi &&
                (z.LedProcessorId == null ||
                 (z.LedProcessor != null && z.LedProcessor.KullanicidaGosterilsinMi)));
        }

        private IQueryable<KullaniciBolge> EtkinAtamaSorgusu(int kullaniciId)
        {
            return _yetkiRepo.GetAll().AsNoTracking().Where(x =>
                x.KullaniciId == kullaniciId &&
                x.Kullanici != null &&
                x.Kullanici.AktifMi &&
                x.OutputZone != null &&
                x.OutputZone.AktifMi &&
                (x.OutputZone.LedProcessorId == null ||
                 (x.OutputZone.LedProcessor != null &&
                  x.OutputZone.LedProcessor.KullanicidaGosterilsinMi)));
        }

        public async Task<HashSet<int>> YetkiliBolgeIdleriAsync(ClaimsPrincipal user)
        {
            if (IsAdmin(user))
            {
                return (await _bolgeRepo.GetAll().AsNoTracking()
                    .Select(z => z.Id)
                    .ToListAsync()).ToHashSet();
            }

            int? kullaniciId = AuthenticatedId(user);
            if (!kullaniciId.HasValue) return new HashSet<int>();

            return (await EtkinAtamaSorgusu(kullaniciId.Value)
                .Select(x => x.OutputZoneId)
                .Distinct()
                .ToListAsync()).ToHashSet();
        }

        public async Task<bool> BolgeYetkisiVarMiAsync(ClaimsPrincipal user, int outputZoneId)
        {
            if (outputZoneId <= 0) return false;
            if (IsAdmin(user)) return true;

            int? kullaniciId = AuthenticatedId(user);
            return kullaniciId.HasValue &&
                await EtkinAtamaSorgusu(kullaniciId.Value)
                    .AnyAsync(x => x.OutputZoneId == outputZoneId);
        }

        public async Task<bool> TumBolgelereYetkiliMiAsync(
            ClaimsPrincipal user, IEnumerable<int> outputZoneIds)
        {
            if (outputZoneIds == null) return false;

            int[] ids = outputZoneIds.Distinct().ToArray();
            if (ids.Length == 0 || ids.Any(x => x <= 0)) return false;
            if (IsAdmin(user)) return true;

            int? kullaniciId = AuthenticatedId(user);
            if (!kullaniciId.HasValue) return false;

            var count = await EtkinAtamaSorgusu(kullaniciId.Value)
                .Where(x => ids.Contains(x.OutputZoneId))
                .Select(x => x.OutputZoneId)
                .Distinct()
                .CountAsync();

            return count == ids.Length;
        }

        public async Task<bool> LedIslemciYetkisiVarMiAsync(ClaimsPrincipal user, int ledProcessorId)
        {
            if (ledProcessorId <= 0) return false;
            if (IsAdmin(user)) return true;

            // Bir islemci birden fazla bolgeyi etkiliyorsa tumune yetki gerekir.
            var bolgeIds = await _bolgeRepo.GetAll().AsNoTracking()
                .Where(z => z.LedProcessorId == ledProcessorId)
                .Select(z => z.Id)
                .ToListAsync();

            return await TumBolgelereYetkiliMiAsync(user, bolgeIds);
        }

        private async Task<Kullanici?> HedefKullaniciGetirAsync(int kullaniciId)
        {
            if (kullaniciId <= 0) return null;
            return await _kullaniciRepo.GetAll().AsNoTracking()
                .FirstOrDefaultAsync(k => k.Id == kullaniciId);
        }

        public async Task<bool> KullaniciVarMiAsync(int kullaniciId)
        {
            return kullaniciId > 0 &&
                await _kullaniciRepo.GetAll().AsNoTracking()
                    .AnyAsync(k => k.Id == kullaniciId);
        }

        public async Task<List<KullaniciBolgeListeDto>> SecilebilirBolgeleriGetirAsync(
            int? kullaniciId = null)
        {
            bool hedefAdmin = false;

            if (kullaniciId.HasValue)
            {
                var kullanici = await HedefKullaniciGetirAsync(kullaniciId.Value)
                    ?? throw new KeyNotFoundException("Kullanici bulunamadi.");
                hedefAdmin = kullanici.Rol == KullaniciRolu.Admin;
            }

            // Admin'e herhangi bir bolge atanabilir (pasif dahil).
            // Normal kullaniciya sadece genel gorunurluk kurali gecerli bolgeler.
            IQueryable<OutputZone> sorgu = hedefAdmin
                ? _bolgeRepo.GetAll().AsNoTracking()
                : NormalKullaniciyaAcikBolgeler();

            return await sorgu
                .OrderBy(z => z.BolgeAdi)
                .ThenBy(z => z.Id)
                .Select(z => new KullaniciBolgeListeDto
                {
                    Id = z.Id,
                    BolgeAdi = z.BolgeAdi,
                    MatrixDeviceId = z.MatrixDeviceId,
                    PortKodu = z.PortKodu
                })
                .ToListAsync();
        }

        public Task<List<int>> KullaniciBolgeIdleriGetirAsync(int kullaniciId)
        {
            // Eski atamalar korunur: LED görünürlüğü kapaninca kayıt silinmez.
            return _yetkiRepo.GetAll().AsNoTracking()
                .Where(x => x.KullaniciId == kullaniciId)
                .OrderBy(x => x.OutputZoneId)
                .Select(x => x.OutputZoneId)
                .ToListAsync();
        }

        private async Task<HashSet<int>> AtanabilirIdlerAsync(Kullanici kullanici)
        {
            IQueryable<OutputZone> sorgu = kullanici.Rol == KullaniciRolu.Admin
                ? _bolgeRepo.GetAll().AsNoTracking()
                : NormalKullaniciyaAcikBolgeler();

            return (await sorgu.Select(z => z.Id).ToListAsync()).ToHashSet();
        }

        public async Task<bool> AtanabilirBolgeIdleriGecerliMiAsync(
            int kullaniciId, IReadOnlyCollection<int> outputZoneIds)
        {
            if (outputZoneIds == null || outputZoneIds.Any(id => id <= 0))
                return false;

            var kullanici = await HedefKullaniciGetirAsync(kullaniciId);
            if (kullanici == null) return false;

            var atanabilir = await AtanabilirIdlerAsync(kullanici);
            return outputZoneIds.All(atanabilir.Contains);
        }

        public async Task KullaniciBolgeleriniKaydetAsync(
            int kullaniciId, IReadOnlyCollection<int> outputZoneIds)
        {
            if (outputZoneIds == null || outputZoneIds.Any(id => id <= 0))
                throw new ArgumentException("Gecersiz bolge listesi.");

            var kullanici = await HedefKullaniciGetirAsync(kullaniciId)
                ?? throw new KeyNotFoundException("Kullanici bulunamadi.");

            var atanabilir = await AtanabilirIdlerAsync(kullanici);
            var hedef = outputZoneIds.ToHashSet();

            // UI filtrelemesi asla tek guvenlik kontrolu degildir.
            if (!hedef.IsSubsetOf(atanabilir))
                throw new ArgumentException("Bu kullaniciya atanamayacak bolge bulunuyor.");

            var mevcut = (await _yetkiRepo.KosulaGoreGetirAsync(
                x => x.KullaniciId == kullaniciId)).ToList();
            var mevcutIds = mevcut.Select(x => x.OutputZoneId).ToHashSet();

            // Normal kullanicida gizli/pasif hale gelen eski atamalari
            // koruyoruz; yalnizca su anda atanabilir bolgeler duzenleniyor.
            // Admin hedefinde tum atamalar duzenlenebilir.
            foreach (var kayit in mevcut.Where(x =>
                atanabilir.Contains(x.OutputZoneId) &&
                !hedef.Contains(x.OutputZoneId)))
            {
                _yetkiRepo.Sil(kayit);
            }

            foreach (var bolgeId in hedef.Where(x => !mevcutIds.Contains(x)))
            {
                await _yetkiRepo.EkleAsync(new KullaniciBolge
                {
                    KullaniciId = kullaniciId,
                    OutputZoneId = bolgeId
                });
            }

            await _unitOfWork.KaydetAsync();
        }
    }
}

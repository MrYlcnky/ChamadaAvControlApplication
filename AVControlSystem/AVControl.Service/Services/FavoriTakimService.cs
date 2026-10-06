using AVControl.Core.Entities;
using AVControl.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AVControl.Service.Services
{
    public class FavoriTakimService
        : GenericService<FavoriTakim>, IFavoriTakimService
    {
        private readonly IGenericRepository<FavoriTakimLig>
            _favoriTakimLigRepository;

        public FavoriTakimService(
            IGenericRepository<FavoriTakim> repository,
            IUnitOfWork unitOfWork,
            IGenericRepository<FavoriTakimLig> favoriTakimLigRepository)
            : base(repository, unitOfWork)
        {
            _favoriTakimLigRepository = favoriTakimLigRepository;
        }

        // ------------------------------------------------------------
        // TÜM TAKIMLARI LİGLERİYLE GETİR
        // ------------------------------------------------------------

        public async Task<IEnumerable<FavoriTakim>>
            TumunuLigleriyleGetirAsync()
        {
            return await _repository
                .GetAll()
                .AsNoTracking()
                .Include(x => x.FavoriTakimLigleri)
                .OrderBy(x => x.TakimAdi)
                .ToListAsync();
        }

        // ------------------------------------------------------------
        // TEK TAKIMI LİGLERİYLE GETİR
        // ------------------------------------------------------------

        public async Task<FavoriTakim?>
            IdyeGoreLigleriyleGetirAsync(int id)
        {
            return await _repository
                .GetAll()
                .AsNoTracking()
                .Include(x => x.FavoriTakimLigleri)
                .FirstOrDefaultAsync(x => x.Id == id);
        }

        // ------------------------------------------------------------
        // TAKIM + LİGLER EKLE
        // ------------------------------------------------------------

        public async Task<FavoriTakim> EkleLigleriyleAsync(
            FavoriTakim entity,
            IEnumerable<string> ligler)
        {
            var mevcutTakim = await _repository.KosulaGoreGetirAsync(x =>
                x.TakimAdi.ToLower() == entity.TakimAdi.Trim().ToLower());

            if (mevcutTakim.Any())
            {
                throw new Exception(
                    "Bu takım zaten favori takımlar arasında kayıtlı.");
            }

            entity.TakimAdi = entity.TakimAdi.Trim();

            await _repository.EkleAsync(entity);

            // Önce ID oluşsun.
            await _unitOfWork.KaydetAsync();

            var temizLigler = LigleriTemizle(ligler);

            foreach (var ligAdi in temizLigler)
            {
                await _favoriTakimLigRepository.EkleAsync(
                    new FavoriTakimLig
                    {
                        FavoriTakimId = entity.Id,
                        LigAdi = ligAdi,
                        AktifMi = true
                    });
            }

            await _unitOfWork.KaydetAsync();

            return entity;
        }

        // ------------------------------------------------------------
        // TAKIM + LİGLER GÜNCELLE
        // ------------------------------------------------------------

        public async Task GuncelleLigleriyleAsync(
            FavoriTakim entity,
            IEnumerable<string> ligler)
        {
            var ayniTakimVarMi =
                (await _repository.KosulaGoreGetirAsync(x =>
                    x.TakimAdi.ToLower() ==
                        entity.TakimAdi.Trim().ToLower() &&
                    x.Id != entity.Id))
                .Any();

            if (ayniTakimVarMi)
            {
                throw new Exception(
                    "Bu takım adı başka bir favori takım tarafından kullanılıyor.");
            }

            entity.TakimAdi = entity.TakimAdi.Trim();

            _repository.Guncelle(entity);

            // Eski takım-lig eşleşmelerini al.
            var eskiLigler =
                (await _favoriTakimLigRepository
                    .KosulaGoreGetirAsync(x =>
                        x.FavoriTakimId == entity.Id))
                .ToList();

            // Eski eşleşmeleri temizle.
            foreach (var eskiLig in eskiLigler)
            {
                _favoriTakimLigRepository.Sil(eskiLig);
            }

            // Yeni seçimleri ekle.
            var temizLigler = LigleriTemizle(ligler);

            foreach (var ligAdi in temizLigler)
            {
                await _favoriTakimLigRepository.EkleAsync(
                    new FavoriTakimLig
                    {
                        FavoriTakimId = entity.Id,
                        LigAdi = ligAdi,
                        AktifMi = true
                    });
            }

            await _unitOfWork.KaydetAsync();
        }

        // ------------------------------------------------------------
        // LİG İSİMLERİNİ TEMİZLE
        // ------------------------------------------------------------

        private static List<string> LigleriTemizle(
            IEnumerable<string>? ligler)
        {
            if (ligler == null)
            {
                return new List<string>();
            }

            return ligler
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
        }
    }
}
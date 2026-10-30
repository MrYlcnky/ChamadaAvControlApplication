using AVControl.Core.Dtos.IslemLogDtos;
using AVControl.Core.Entities;
using AVControl.Data.Context;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AVControl.WEBAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class IslemLogController : ControllerBase
    {
        private readonly AppDbContext _context;

        public IslemLogController(AppDbContext context)
        {
            _context = context;
        }

        // GET api/IslemLog/listele?page=1&pageSize=25&arama=...
        [HttpGet("listele")]
        public async Task<IActionResult> Listele(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25,
            [FromQuery] string? arama = null,
            [FromQuery] int? kullaniciId = null,
            [FromQuery] string? islemTipi = null,
            [FromQuery] DateTime? baslangic = null,
            [FromQuery] DateTime? bitis = null)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            if (baslangic.HasValue && bitis.HasValue &&
                baslangic.Value.Date > bitis.Value.Date)
            {
                return BadRequest(new
                {
                    mesaj = "Başlangıç tarihi bitiş tarihinden sonra olamaz."
                });
            }

            IQueryable<IslemLog> query = _context.IslemLoglari.AsNoTracking();

            if (kullaniciId.HasValue && kullaniciId.Value > 0)
            {
                query = query.Where(x => x.KullaniciId == kullaniciId.Value);
            }

            if (!string.IsNullOrWhiteSpace(islemTipi))
            {
                string tip = islemTipi.Trim();
                query = query.Where(x => x.IslemTipi == tip);
            }

            if (baslangic.HasValue)
            {
                DateTime ilkGun = baslangic.Value.Date;
                query = query.Where(x => x.OlusturulmaTarihi >= ilkGun);
            }

            if (bitis.HasValue)
            {
                DateTime ertesiGun = bitis.Value.Date.AddDays(1);
                query = query.Where(x => x.OlusturulmaTarihi < ertesiGun);
            }

            if (!string.IsNullOrWhiteSpace(arama))
            {
                string kelime = arama.Trim();

                if (kelime.Length > 100)
                    return BadRequest(new { mesaj = "Arama en fazla 100 karakter olabilir." });

                query = query.Where(x =>
                    (x.Detaylar != null && x.Detaylar.Contains(kelime)) ||
                    (x.IslemTipi != null && x.IslemTipi.Contains(kelime)) ||
                    (x.Kullanici != null &&
                     ((x.Kullanici.KullaniciAdi != null &&
                       x.Kullanici.KullaniciAdi.Contains(kelime)) ||
                      (x.Kullanici.Ad != null &&
                       x.Kullanici.Ad.Contains(kelime)) ||
                      (x.Kullanici.Soyad != null &&
                       x.Kullanici.Soyad.Contains(kelime))))
                );
            }

            // Filtrelenmiş toplam kayıt; tamamı istemciye gönderilmez.
            int totalCount = await query.CountAsync();
            int totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            if (totalPages > 0)
                page = Math.Min(page, totalPages);
            else
                page = 1;

            var items = await query
                .OrderByDescending(x => x.OlusturulmaTarihi)
                .ThenByDescending(x => x.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new IslemLogListeDto
                {
                    Id = x.Id,
                    KullaniciId = x.KullaniciId,
                    KullaniciAdSoyad = x.Kullanici == null
                        ? null
                        : (x.Kullanici.Ad ?? "") + " " + (x.Kullanici.Soyad ?? ""),
                    IslemTipi = x.IslemTipi,
                    Detaylar = x.Detaylar,
                    OlusturulmaTarihi = x.OlusturulmaTarihi
                })
                .ToListAsync();

            return Ok(new
            {
                items,
                page,
                pageSize,
                totalCount,
                totalPages,
                hasPreviousPage = page > 1,
                hasNextPage = page < totalPages
            });
        }

        // Kullanıcı ve işlem türü filtre seçenekleri.
        [HttpGet("filtre-secenekleri")]
        public async Task<IActionResult> FiltreSecenekleri()
        {
            var kullanicilar = await _context.Kullanicilar
                .AsNoTracking()
                .OrderBy(x => x.KullaniciAdi)
                .Select(x => new
                {
                    x.Id,
                    x.KullaniciAdi,
                    x.Ad,
                    x.Soyad
                })
                .ToListAsync();

            var islemTipleri = await _context.IslemLoglari
                .AsNoTracking()
                .Where(x => x.IslemTipi != null && x.IslemTipi != "")
                .Select(x => x.IslemTipi)
                .Distinct()
                .OrderBy(x => x)
                .ToListAsync();

            return Ok(new { kullanicilar, islemTipleri });
        }
    }
}

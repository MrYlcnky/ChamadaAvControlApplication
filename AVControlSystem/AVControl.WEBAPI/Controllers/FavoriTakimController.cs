using AVControl.Core.Dtos.FavoriTakim;
using AVControl.Core.Dtos.FavoriTakimDtos;
using AVControl.Core.Entities;
using AVControl.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AVControl.WEBAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FavoriTakimController : ControllerBase
    {
        private readonly IFavoriTakimService _service;

        public FavoriTakimController(IFavoriTakimService service)
        {
            _service = service;
        }

        // ------------------------------------------------------------
        // LİSTE
        // ------------------------------------------------------------

        [HttpGet("liste")]
        public async Task<IActionResult> Liste()
        {
            var takimlar =
                await _service.TumunuLigleriyleGetirAsync();

            var dtoList = takimlar.Select(takim =>
                new FavoriTakimListeDto
                {
                    Id = takim.Id,
                    TakimAdi = takim.TakimAdi,
                    AktifMi = takim.AktifMi,

                    Ligler = takim.FavoriTakimLigleri
                        .Where(x => x.AktifMi)
                        .Select(x => x.LigAdi)
                        .OrderBy(x => x)
                        .ToList()
                })
                .ToList();

            return Ok(dtoList);
        }

        // ------------------------------------------------------------
        // TEK TAKIM GETİR
        // ------------------------------------------------------------

        [HttpGet("getir/{id}")]
        public async Task<IActionResult> Getir(int id)
        {
            var takim =
                await _service.IdyeGoreLigleriyleGetirAsync(id);

            if (takim == null)
            {
                return NotFound(new
                {
                    mesaj = "Takım bulunamadı."
                });
            }

            var dto = new FavoriTakimListeDto
            {
                Id = takim.Id,
                TakimAdi = takim.TakimAdi,
                AktifMi = takim.AktifMi,

                Ligler = takim.FavoriTakimLigleri
                    .Where(x => x.AktifMi)
                    .Select(x => x.LigAdi)
                    .OrderBy(x => x)
                    .ToList()
            };

            return Ok(dto);
        }

        // ------------------------------------------------------------
        // EKLE
        // ------------------------------------------------------------

        [Authorize(Roles = "Admin")]
        [HttpPost("ekle")]
        public async Task<IActionResult> Ekle(
            [FromBody] FavoriTakimEkleDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.TakimAdi))
            {
                return BadRequest(new
                {
                    mesaj = "Takım adı boş olamaz."
                });
            }

            var takimEntity = new FavoriTakim
            {
                TakimAdi = dto.TakimAdi.Trim(),
                AktifMi = dto.AktifMi
            };

            try
            {
                await _service.EkleLigleriyleAsync(
                    takimEntity,
                    dto.Ligler);

                return Ok(new
                {
                    mesaj = "Favori takım ve ligleri başarıyla eklendi."
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    mesaj = ex.Message
                });
            }
        }

        // ------------------------------------------------------------
        // GÜNCELLE
        // ------------------------------------------------------------

        [Authorize(Roles = "Admin")]
        [HttpPut("guncelle")]
        public async Task<IActionResult> Guncelle(
            [FromBody] FavoriTakimGuncelleDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.TakimAdi))
            {
                return BadRequest(new
                {
                    mesaj = "Takım adı boş olamaz."
                });
            }

            var mevcutTakim =
                await _service.IdyeGoreGetirAsync(dto.Id);

            if (mevcutTakim == null)
            {
                return NotFound(new
                {
                    mesaj = "Güncellenecek takım bulunamadı."
                });
            }

            mevcutTakim.TakimAdi = dto.TakimAdi.Trim();
            mevcutTakim.AktifMi = dto.AktifMi;

            try
            {
                await _service.GuncelleLigleriyleAsync(
                    mevcutTakim,
                    dto.Ligler);

                return Ok(new
                {
                    mesaj = "Favori takım ve ligleri başarıyla güncellendi."
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    mesaj = ex.Message
                });
            }
        }

        // ------------------------------------------------------------
        // SİL
        // ------------------------------------------------------------

        [Authorize(Roles = "Admin")]
        [HttpDelete("sil/{id}")]
        public async Task<IActionResult> Sil(int id)
        {
            var mevcutTakim =
                await _service.IdyeGoreGetirAsync(id);

            if (mevcutTakim == null)
            {
                return NotFound(new
                {
                    mesaj = "Silinecek takım bulunamadı."
                });
            }

            await _service.SilAsync(mevcutTakim);

            return Ok(new
            {
                mesaj = "Favori takım başarıyla silindi."
            });
        }
    }
}
using AutoMapper;
using AVControl.Core.Dtos.MacTakvimDtos;
using AVControl.Core.Entities;
using AVControl.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Globalization;

namespace AVControl.WEBAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MacTakvimController : ControllerBase
    {
        private readonly IMacTakvimService _service;
        private readonly IMapper _mapper;

        public MacTakvimController(IMacTakvimService service, IMapper mapper)
        {
            _service = service;
            _mapper = mapper;
        }

        // HERKES GÖREBİLİR
        [AllowAnonymous]
        [HttpGet("liste")]
        public async Task<IActionResult> Liste()
        {
            var maclar = await _service.TumunuGetirAsync();
            var dtoList = _mapper.Map<IEnumerable<MacTakvimListeDto>>(maclar);

            return Ok(dtoList);
        }

        [AllowAnonymous]
        [HttpGet("getir/{id}")]
        public async Task<IActionResult> Getir(int id)
        {
            var mac = await _service.IdyeGoreGetirAsync(id);

            if (mac == null)
                return NotFound("Maç bulunamadı.");

            var dto = _mapper.Map<MacTakvimListeDto>(mac);

            return Ok(dto);
        }

        // MAÇ MANUEL EKLEME
        [AllowAnonymous]
        [HttpPost("ekle")]
        public async Task<IActionResult> Ekle(MacTakvimEkleDto dto)
        {
            var macEntity = _mapper.Map<MacTakvim>(dto);
            await _service.EkleAsync(macEntity);

            return Ok(new { mesaj = "Maç başarıyla eklendi." });
        }

        // MAÇ MANUEL GÜNCELLEME
        [AllowAnonymous]
        [HttpPut("guncelle")]
        public async Task<IActionResult> Guncelle(MacTakvimGuncelleDto dto)
        {
            var mevcutMac = await _service.IdyeGoreGetirAsync(dto.Id);

            if (mevcutMac == null)
                return NotFound("Güncellenecek maç bulunamadı.");

            _mapper.Map(dto, mevcutMac);
            await _service.GuncelleAsync(mevcutMac);

            return Ok(new { mesaj = "Maç başarıyla güncellendi." });
        }

        // SADECE ADMIN SİLEBİLİR
        [Authorize(Roles = "Admin")]
        [HttpDelete("sil/{id}")]
        public async Task<IActionResult> Sil(int id)
        {
            var mevcutMac = await _service.IdyeGoreGetirAsync(id);

            if (mevcutMac == null)
                return NotFound("Silinecek maç bulunamadı.");

            await _service.SilAsync(mevcutMac);

            return Ok(new { mesaj = "Maç başarıyla silindi." });
        }

        [AllowAnonymous]
        [HttpPost("yenile")]
        public async Task<IActionResult> Yenile([FromQuery] string? tarih)
        {
            try
            {
                // Gelen tarihte nokta varsa slash'a çevir
                if (!string.IsNullOrWhiteSpace(tarih)) tarih = tarih.Replace(".", "/");

                string hedefTarih = string.IsNullOrWhiteSpace(tarih)
                    ? DateTime.Now.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture)
                    : tarih;

                await _service.VerileriSenkronizeEtAsync(hedefTarih);

                return Ok(new { mesaj = $"{hedefTarih} tarihli Maçkolik verileri başarıyla senkronize edildi." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { mesaj = "Senkronizasyon sırasında hata oluştu.", detay = ex.Message });
            }
        }

        [AllowAnonymous]
        [HttpGet("gunun-maclari")]
        public async Task<IActionResult> GununMaclari([FromQuery] string? tarih)
        {
            try
            {
                // Kullanıcı veya sistem nokta gönderirse slash yapalım
                if (!string.IsNullOrWhiteSpace(tarih)) tarih = tarih.Replace(".", "/");

                // 1. Tarihi belirle
                DateTime dt = string.IsNullOrWhiteSpace(tarih)
                              ? DateTime.Now
                              : DateTime.ParseExact(tarih, "dd/MM/yyyy", CultureInfo.InvariantCulture);

                // 2. ToString yaparken InvariantCulture kullanıyoruz ki sunucu "." yapmasın
                string guvenliTarihStr = dt.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture);

                // Önce senkronize et
                await _service.VerileriSenkronizeEtAsync(guvenliTarihStr);

                // Filtreli getir
                var maclar = await _service.GununFavoriMaclariniGetirAsync(dt);

                return Ok(_mapper.Map<IEnumerable<MacTakvimListeDto>>(maclar));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CONTROLLER HATA] GununMaclari: {ex.Message}");
                return StatusCode(500, new { mesaj = "Maçlar yüklenirken bir hata oluştu.", detay = ex.Message });
            }
        }

        // TEST ENDPOINT - DIRECT
        [AllowAnonymous]
        [HttpGet("direct-test")]
        public async Task<IActionResult> DirectTest([FromQuery] string? tarih)
        {
            Console.WriteLine("[CONTROLLER] /api/MacTakvim/direct-test endpointine girildi.");
            var data = await _service.GetirCanliVeriDirectAsync(tarih);

            return Ok(new
            {
                adet = data.Count(),
                maclar = data
            });
        }
    }
}
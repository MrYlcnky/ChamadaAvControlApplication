using AutoMapper;
using AVControl.Core.Dtos.KullaniciDtos;
using AVControl.Core.Entities;
using AVControl.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AVControl.WEBAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class KullaniciController : ControllerBase
    {
        private readonly IKullaniciService _kullaniciService;
        private readonly IMapper _mapper;

        public KullaniciController(IKullaniciService kullaniciService, IMapper mapper)
        {
            _kullaniciService = kullaniciService;
            _mapper = mapper;
        }

        [HttpGet("listele")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> TumunuGetir()
        {
            var data = await _kullaniciService.TumunuGetirAsync();
            return Ok(_mapper.Map<IEnumerable<KullaniciListeDto>>(data));
        }

        [HttpPost("ekle")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Ekle(KullaniciEkleDto dto)
        {
            if (await _kullaniciService.KullaniciAdiKullanimdaMiAsync(dto.KullaniciAdi))
                return BadRequest(new { mesaj = "Bu kullanıcı adı zaten alınmış." });

            var kullanici = _mapper.Map<Kullanici>(dto);
            kullanici.SifreHash = BCrypt.Net.BCrypt.HashPassword(dto.Sifre);

            await _kullaniciService.EkleAsync(kullanici);
            return Ok(new { mesaj = "Kullanıcı başarıyla eklendi." });
        }

        [HttpPut("guncelle")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Guncelle(KullaniciGuncelleDto dto)
        {
            // 1. Veritabanından mevcut kullanıcıyı çek
            var mevcutKullanici = await _kullaniciService.IdyeGoreGetirAsync(dto.Id);

            if (mevcutKullanici == null)
                return NotFound(new { mesaj = "Kullanıcı bulunamadı." });

            // 2. AutoMapper'ın şifreyi ezmesini istemiyoruz, bu yüzden önce verileri eşle
            // Not: Mapping profilinde Sifre alanını ignore ettiğinden emin ol
            _mapper.Map(dto, mevcutKullanici);

            // 3. Şifre değişmiş mi kontrol et (Eğer DTO'dan şifre geliyorsa hashle)
            if (!string.IsNullOrEmpty(dto.Sifre))
            {
                mevcutKullanici.SifreHash = BCrypt.Net.BCrypt.HashPassword(dto.Sifre);
            }
            // Eğer şifre gelmiyorsa (boşsa), mevcut SifreHash'e dokunma.

            // 4. Servise güncelleme için gönder
            await _kullaniciService.GuncelleAsync(mevcutKullanici);

            return Ok(new { mesaj = "Kullanıcı bilgileri güncellendi." });
        }
        [HttpDelete("sil/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Sil(int id)
        {
            var entity = await _kullaniciService.IdyeGoreGetirAsync(id);
            if (entity == null) return NotFound();
            await _kullaniciService.SilAsync(entity);
            return Ok(new { mesaj = "Kullanıcı silindi." });
        }
    }
}
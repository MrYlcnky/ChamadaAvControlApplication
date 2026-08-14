using AutoMapper;
using AVControl.Core.Dtos.ChannelListDtos;
using AVControl.Core.Entities;
using AVControl.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AVControl.WEBAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ChannelListController : ControllerBase
    {
        private readonly IService<ChannelList> _service;
        private readonly IMapper _mapper;

        public ChannelListController(IService<ChannelList> service, IMapper mapper)
        {
            _service = service;
            _mapper = mapper;
        }

        [HttpGet("listele")]
        public async Task<IActionResult> TumunuGetir()
        {
            var userRole = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;

            // Tüm kanalları veritabanından çekiyoruz
            var data = await _service.TumunuGetirAsync();

            // 1. EĞER ADMIN İSE: Hiçbir filtreleme yapma, hepsini (Aktif/Pasif) gönder ki yönetebilsin.
            if (userRole == "Admin" || userRole == "1")
            {
                return Ok(_mapper.Map<IEnumerable<ChannelListListeDto>>(data));
            }

            // 2. EĞER NORMAL KULLANICI İSE: Sadece "Aktif" VE "Kullanıcıda Göster" olanları gönder.
            var filteredData = data.Where(x => x.AktifMi && x.KullanicidaGosterilsinMi);

            return Ok(_mapper.Map<IEnumerable<ChannelListListeDto>>(filteredData));
        }

        [HttpPost("ekle")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Ekle(ChannelListEkleDto dto)
        {
            await _service.EkleAsync(_mapper.Map<ChannelList>(dto));
            return Ok(new { mesaj = "Kanal eklendi." });
        }

        [HttpPut("guncelle")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Guncelle(ChannelListGuncelleDto dto)
        {
            await _service.GuncelleAsync(_mapper.Map<ChannelList>(dto));
            return Ok(new { mesaj = "Kanal güncellendi." });
        }

        [HttpDelete("sil/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Sil(int id)
        {
            var entity = await _service.IdyeGoreGetirAsync(id);
            if (entity == null) return NotFound();
            await _service.SilAsync(entity);
            return Ok(new { mesaj = "Kanal silindi." });
        }
    }
}
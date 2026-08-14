using AutoMapper;
using AVControl.Core.Dtos.LedProcessorDtos;
using AVControl.Core.Entities;
using AVControl.Core.Interfaces;
using AVControl.WEBAPI.Helpers; // 🔥 Helper eklendi
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AVControl.WEBAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class LedProcessorController : ControllerBase
    {
        private readonly IService<LedProcessor> _service;
        private readonly IMapper _mapper;

        public LedProcessorController(IService<LedProcessor> service, IMapper mapper)
        {
            _service = service;
            _mapper = mapper;
        }

        [HttpGet("listele")]
        public async Task<IActionResult> TumunuGetir()
        {
            var data = await _service.TumunuGetirAsync();
            return Ok(_mapper.Map<IEnumerable<LedProcessorListeDto>>(data));
        }

        [HttpPost("ekle")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Ekle([FromForm] LedProcessorEkleDto dto) 
        {
            var entity = _mapper.Map<LedProcessor>(dto);

            // 1. Önce cihazı kaydet ve ID al
            await _service.EkleAsync(entity);

            // 2. Eğer resim yüklendiyse, resmi kaydet ve URL'i cihaza ekle
            if (dto.GorselDosyasi != null)
            {
                entity.CihazGorselUrl = await FileHelper.GorselKaydetAsync(dto.GorselDosyasi, entity.Id, entity.CihazAdi);
                await _service.GuncelleAsync(entity); // URL eklendiği için güncelle
            }

            return Ok(new { mesaj = "LED işlemci eklendi." });
        }

        [HttpPut("guncelle")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Guncelle([FromForm] LedProcessorGuncelleDto dto) 
        {
            var mevcutCihaz = await _service.IdyeGoreGetirAsync(dto.Id);
            if (mevcutCihaz == null) return NotFound();

            // Resim geldiyse güncelliyoruz
            if (dto.GorselDosyasi != null)
            {
                string cihazAdi = !string.IsNullOrWhiteSpace(dto.CihazAdi) ? dto.CihazAdi : mevcutCihaz.CihazAdi;
                mevcutCihaz.CihazGorselUrl = await FileHelper.GorselKaydetAsync(dto.GorselDosyasi, mevcutCihaz.Id, cihazAdi);
            }

            // DTO'daki diğer alanları Entity'e aktar (AutoMapper profilinde CihazGorselUrl'i Ignore etmelisin)
            _mapper.Map(dto, mevcutCihaz);

            await _service.GuncelleAsync(mevcutCihaz);
            return Ok(new { mesaj = "LED işlemci güncellendi." });
        }

        [HttpDelete("sil/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Sil(int id)
        {
            var entity = await _service.IdyeGoreGetirAsync(id);
            if (entity == null) return NotFound();
            await _service.SilAsync(entity);
            return Ok(new { mesaj = "LED işlemci silindi." });
        }
    }
}
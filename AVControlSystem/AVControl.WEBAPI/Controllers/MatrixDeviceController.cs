using AutoMapper;
using AVControl.Core.Dtos.MatrixDeviceDtos;
using AVControl.Core.Entities;
using AVControl.Core.Interfaces;
using AVControl.WEBAPI.Helpers; 
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AVControl.WEBAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MatrixDeviceController : ControllerBase
    {
        private readonly IService<MatrixDevice> _matrixService;
        private readonly IMapper _mapper;

        public MatrixDeviceController(IService<MatrixDevice> matrixService, IMapper mapper)
        {
            _matrixService = matrixService;
            _mapper = mapper;
        }

        [HttpGet("listele")]
        public async Task<IActionResult> TumunuGetir()
        {
            var cihazlar = await _matrixService.TumunuGetirAsync();
            var dtos = _mapper.Map<IEnumerable<MatrixDeviceListeDto>>(cihazlar);
            return Ok(dtos);
        }

        [HttpPost("ekle")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Ekle([FromForm] MatrixDeviceEkleDto dto) 
        {
            var cihaz = _mapper.Map<MatrixDevice>(dto);

            // 1. Önce cihazı kaydet ve ID al
            await _matrixService.EkleAsync(cihaz);

            // 2. Resim varsa kaydet
            if (dto.GorselDosyasi != null)
            {
                cihaz.CihazGorselUrl = await FileHelper.GorselKaydetAsync(dto.GorselDosyasi, cihaz.Id, cihaz.CihazAdi);
                await _matrixService.GuncelleAsync(cihaz);
            }

            return Ok(new { mesaj = "Matrix cihazı başarıyla eklendi." });
        }

        [HttpPut("guncelle")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Guncelle([FromForm] MatrixDeviceGuncelleDto dto) 
        {
            var mevcutCihaz = await _matrixService.IdyeGoreGetirAsync(dto.Id);
            if (mevcutCihaz == null) return NotFound(new { mesaj = "Cihaz bulunamadı." });

            if (dto.GorselDosyasi != null)
            {
                string cihazAdi = !string.IsNullOrWhiteSpace(dto.CihazAdi) ? dto.CihazAdi : mevcutCihaz.CihazAdi;
                mevcutCihaz.CihazGorselUrl = await FileHelper.GorselKaydetAsync(dto.GorselDosyasi, mevcutCihaz.Id, cihazAdi);
            }

            _mapper.Map(dto, mevcutCihaz);

            await _matrixService.GuncelleAsync(mevcutCihaz);
            return Ok(new { mesaj = "Cihaz başarıyla güncellendi." });
        }

        [HttpDelete("sil/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Sil(int id)
        {
            var cihaz = await _matrixService.IdyeGoreGetirAsync(id);
            if (cihaz == null) return NotFound(new { mesaj = "Cihaz bulunamadı." });

            await _matrixService.SilAsync(cihaz);
            return Ok(new { mesaj = "Cihaz başarıyla silindi." });
        }
    }
}
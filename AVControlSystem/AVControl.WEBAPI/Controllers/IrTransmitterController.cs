using AutoMapper;
using AVControl.Core.Dtos.IrTransmitterDtos;
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
    public class IrTransmitterController : ControllerBase
    {
        private readonly IService<IrTransmitter> _service;
        private readonly IMapper _mapper;

        public IrTransmitterController(IService<IrTransmitter> service, IMapper mapper)
        {
            _service = service;
            _mapper = mapper;
        }

        [HttpGet("listele")]
        public async Task<IActionResult> TumunuGetir()
        {
            var data = await _service.TumunuGetirAsync();
            return Ok(_mapper.Map<IEnumerable<IrTransmitterListeDto>>(data));
        }

        [HttpPost("ekle")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Ekle([FromForm] IrTransmitterEkleDto dto) 
        {
            var entity = _mapper.Map<IrTransmitter>(dto);

            await _service.EkleAsync(entity);

            if (dto.GorselDosyasi != null)
            {
                // IR Cihazında isim prop'u yoksa "ir_verici" veya MAC adresi/IP verebiliriz
                entity.CihazGorselUrl = await FileHelper.GorselKaydetAsync(dto.GorselDosyasi, entity.Id, "ir_verici");
                await _service.GuncelleAsync(entity);
            }

            return Ok(new { mesaj = "IR Verici eklendi." });
        }

        [HttpPut("guncelle")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Guncelle([FromForm] IrTransmitterGuncelleDto dto) 
        {
            var mevcutCihaz = await _service.IdyeGoreGetirAsync(dto.Id);
            if (mevcutCihaz == null) return NotFound();

            if (dto.GorselDosyasi != null)
            {
                mevcutCihaz.CihazGorselUrl = await FileHelper.GorselKaydetAsync(dto.GorselDosyasi, mevcutCihaz.Id, "ir_verici");
            }

            _mapper.Map(dto, mevcutCihaz);
            await _service.GuncelleAsync(mevcutCihaz);
            return Ok(new { mesaj = "IR Verici güncellendi." });
        }

        [HttpDelete("sil/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Sil(int id)
        {
            var entity = await _service.IdyeGoreGetirAsync(id);
            if (entity == null) return NotFound();
            await _service.SilAsync(entity);
            return Ok(new { mesaj = "IR Verici silindi." });
        }
    }
}
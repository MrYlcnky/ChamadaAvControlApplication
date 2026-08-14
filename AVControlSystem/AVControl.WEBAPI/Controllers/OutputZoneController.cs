using AutoMapper;
using AVControl.Core.Dtos.OutputZoneDtos;
using AVControl.Core.Entities;
using AVControl.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AVControl.WEBAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OutputZoneController : ControllerBase
    {
        private readonly IService<OutputZone> _service;
        private readonly IMapper _mapper;

        public OutputZoneController(IService<OutputZone> service, IMapper mapper)
        {
            _service = service;
            _mapper = mapper;
        }

        [HttpGet("listele")]
        public async Task<IActionResult> TumunuGetir()
        {
            // Çıkış bölgesi listelenirken bağlı olduğu Matrix ve LED işlemciyi de çekiyoruz.
            var data = await _service.TumunuGetirIlişkiliAsync(
                x => x.MatrixDevice!,
                x => x.LedProcessor!
            );
            return Ok(_mapper.Map<IEnumerable<OutputZoneListeDto>>(data));
        }

        [HttpPost("ekle")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Ekle(OutputZoneEkleDto dto)
        {
            await _service.EkleAsync(_mapper.Map<OutputZone>(dto));
            return Ok(new { mesaj = "Çıkış bölgesi eklendi." });
        }

        [HttpPut("guncelle")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Guncelle(OutputZoneGuncelleDto dto)
        {
            await _service.GuncelleAsync(_mapper.Map<OutputZone>(dto));
            return Ok(new { mesaj = "Çıkış bölgesi güncellendi." });
        }

        [HttpDelete("sil/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Sil(int id)
        {
            var entity = await _service.IdyeGoreGetirAsync(id);
            if (entity == null) return NotFound();
            await _service.SilAsync(entity);
            return Ok(new { mesaj = "Çıkış bölgesi silindi." });
        }
    }
}
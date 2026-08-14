using AutoMapper;
using AVControl.Core.Dtos.RemoteControlDtos;
using AVControl.Core.Entities;
using AVControl.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AVControl.WEBAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class RemoteControlController : ControllerBase
    {
        private readonly IService<RemoteControl> _service;
        private readonly IMapper _mapper;

        public RemoteControlController(IService<RemoteControl> service, IMapper mapper)
        {
            _service = service;
            _mapper = mapper;
        }

        [HttpGet("listele")]
        public async Task<IActionResult> TumunuGetir()
        {
            var data = await _service.TumunuGetirAsync();
            return Ok(_mapper.Map<IEnumerable<RemoteControlListeDto>>(data));
        }

        [HttpPost("ekle")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Ekle(RemoteControlEkleDto dto)
        {
            await _service.EkleAsync(_mapper.Map<RemoteControl>(dto));
            return Ok(new { mesaj = "Kumanda profili eklendi." });
        }

        [HttpPut("guncelle")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Guncelle(RemoteControlGuncelleDto dto)
        {
            await _service.GuncelleAsync(_mapper.Map<RemoteControl>(dto));
            return Ok(new { mesaj = "Kumanda profili güncellendi." });
        }

        [HttpDelete("sil/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Sil(int id)
        {
            var entity = await _service.IdyeGoreGetirAsync(id);
            if (entity == null) return NotFound();
            await _service.SilAsync(entity);
            return Ok(new { mesaj = "Kumanda profili silindi." });
        }
    }
}
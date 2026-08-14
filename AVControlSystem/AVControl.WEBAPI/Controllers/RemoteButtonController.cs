using AutoMapper;
using AVControl.Core.Dtos.RemoteButtonDtos;
using AVControl.Core.Entities;
using AVControl.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AVControl.WEBAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class RemoteButtonController : ControllerBase
    {
        private readonly IService<RemoteButton> _service;
        private readonly IMapper _mapper;

        public RemoteButtonController(IService<RemoteButton> service, IMapper mapper)
        {
            _service = service;
            _mapper = mapper;
        }

        [HttpGet("listele")]
        public async Task<IActionResult> TumunuGetir()
        {
            var data = await _service.TumunuGetirAsync();
            return Ok(_mapper.Map<IEnumerable<RemoteButtonListeDto>>(data));
        }

        [HttpPost("ekle")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Ekle(RemoteButtonEkleDto dto)
        {
            await _service.EkleAsync(_mapper.Map<RemoteButton>(dto));
            return Ok(new { mesaj = "Kumanda tuşu eklendi." });
        }

        [HttpPut("guncelle")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Guncelle(RemoteButtonGuncelleDto dto)
        {
            await _service.GuncelleAsync(_mapper.Map<RemoteButton>(dto));
            return Ok(new { mesaj = "Kumanda tuşu güncellendi." });
        }

        [HttpDelete("sil/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Sil(int id)
        {
            var entity = await _service.IdyeGoreGetirAsync(id);
            if (entity == null) return NotFound();
            await _service.SilAsync(entity);
            return Ok(new { mesaj = "Kumanda tuşu silindi." });
        }
    }
}
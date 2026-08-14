using AutoMapper;
using AVControl.Core.Dtos.InputSourceDtos;
using AVControl.Core.Entities;
using AVControl.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AVControl.WEBAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class InputSourceController : ControllerBase
    {
        private readonly IService<InputSource> _service;
        private readonly IMapper _mapper;

        public InputSourceController(IService<InputSource> service, IMapper mapper)
        {
            _service = service;
            _mapper = mapper;
        }

        [HttpGet("listele")]
        public async Task<IActionResult> TumunuGetir()
        {
            // Giriş kaynağı listelenirken Matrix, Kumanda ve Pi cihazlarının adlarını da SQL JOIN ile çekiyoruz.
            var data = await _service.TumunuGetirIlişkiliAsync(
                x => x.MatrixDevice!,
                x => x.RemoteControl!,
                x => x.IrTransmitter!
            );
            return Ok(_mapper.Map<IEnumerable<InputSourceListeDto>>(data));
        }

        [HttpPost("ekle")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Ekle(InputSourceEkleDto dto)
        {
            await _service.EkleAsync(_mapper.Map<InputSource>(dto));
            return Ok(new { mesaj = "Giriş kaynağı eklendi." });
        }

        [HttpPut("guncelle")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Guncelle(InputSourceGuncelleDto dto)
        {
            await _service.GuncelleAsync(_mapper.Map<InputSource>(dto));
            return Ok(new { mesaj = "Giriş kaynağı güncellendi." });
        }

        [HttpDelete("sil/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Sil(int id)
        {
            var entity = await _service.IdyeGoreGetirAsync(id);
            if (entity == null) return NotFound();
            await _service.SilAsync(entity);
            return Ok(new { mesaj = "Giriş kaynağı silindi." });
        }
    }
}
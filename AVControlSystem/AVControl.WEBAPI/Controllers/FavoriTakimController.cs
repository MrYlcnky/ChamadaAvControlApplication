using AutoMapper;
using AVControl.Core.Dtos.FavoriTakim;
using AVControl.Core.Dtos.FavoriTakimDtos;
using AVControl.Core.Entities;
using AVControl.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AVControl.WEBAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FavoriTakimController : ControllerBase
    {
        private readonly IFavoriTakimService _service;
        private readonly IMapper _mapper;

        public FavoriTakimController(IFavoriTakimService service, IMapper mapper)
        {
            _service = service;
            _mapper = mapper;
        }

        [HttpGet("liste")]
        public async Task<IActionResult> Liste()
        {
            var takimlar = await _service.TumunuGetirAsync();
            var dtoList = _mapper.Map<IEnumerable<FavoriTakimListeDto>>(takimlar);
            return Ok(dtoList);
        }

        [HttpGet("getir/{id}")]
        public async Task<IActionResult> Getir(int id)
        {
            var takim = await _service.IdyeGoreGetirAsync(id);
            if (takim == null) return NotFound("Takım bulunamadı.");

            var dto = _mapper.Map<FavoriTakimListeDto>(takim);
            return Ok(dto);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("ekle")]
        public async Task<IActionResult> Ekle(FavoriTakimEkleDto dto)
        {
            var takimEntity = _mapper.Map<FavoriTakim>(dto);
            await _service.EkleAsync(takimEntity);

            return Ok(new { mesaj = "Favori takım başarıyla eklendi." });
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("guncelle")]
        public async Task<IActionResult> Guncelle(FavoriTakimGuncelleDto dto)
        {
            var mevcutTakim = await _service.IdyeGoreGetirAsync(dto.Id);
            if (mevcutTakim == null) return NotFound("Güncellenecek takım bulunamadı.");

            _mapper.Map(dto, mevcutTakim);
            await _service.GuncelleAsync(mevcutTakim);

            return Ok(new { mesaj = "Favori takım başarıyla güncellendi." });
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("sil/{id}")]
        public async Task<IActionResult> Sil(int id)
        {
            var mevcutTakim = await _service.IdyeGoreGetirAsync(id);
            if (mevcutTakim == null) return NotFound("Silinecek takım bulunamadı.");

            await _service.SilAsync(mevcutTakim);

            return Ok(new { mesaj = "Favori takım başarıyla silindi." });
        }
    }
}
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AVControl.Core.Interfaces;
using AVControl.Core.Entities;
using AVControl.Core.Dtos.FavoriLigDtos;
using AutoMapper;

namespace AVControl.WEBAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FavoriLigController : ControllerBase
    {
        private readonly IFavoriLigService _service;
        private readonly IMapper _mapper;

        public FavoriLigController(IFavoriLigService service, IMapper mapper)
        {
            _service = service;
            _mapper = mapper;
        }

        [HttpGet("liste")]
        public async Task<IActionResult> Liste()
        {
            var ligler = await _service.TumunuGetirAsync();
            var dtoList = _mapper.Map<IEnumerable<FavoriLigListeDto>>(ligler);
            return Ok(dtoList);
        }

        [HttpGet("getir/{id}")]
        public async Task<IActionResult> Getir(int id)
        {
            var lig = await _service.IdyeGoreGetirAsync(id);
            if (lig == null) return NotFound("Lig bulunamadı.");

            var dto = _mapper.Map<FavoriLigListeDto>(lig);
            return Ok(dto);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("ekle")]
        public async Task<IActionResult> Ekle(FavoriLigEkleDto dto)
        {
            var ligEntity = _mapper.Map<FavoriLig>(dto);
            await _service.EkleAsync(ligEntity);

            return Ok(new { mesaj = "Favori lig başarıyla eklendi." });
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("guncelle")]
        public async Task<IActionResult> Guncelle(FavoriLigGuncelleDto dto)
        {
            var mevcutLig = await _service.IdyeGoreGetirAsync(dto.Id);
            if (mevcutLig == null) return NotFound("Güncellenecek lig bulunamadı.");

            _mapper.Map(dto, mevcutLig);
            await _service.GuncelleAsync(mevcutLig);

            return Ok(new { mesaj = "Favori lig başarıyla güncellendi." });
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("sil/{id}")]
        public async Task<IActionResult> Sil(int id)
        {
            var mevcutLig = await _service.IdyeGoreGetirAsync(id);
            if (mevcutLig == null) return NotFound("Silinecek lig bulunamadı.");

            await _service.SilAsync(mevcutLig);

            return Ok(new { mesaj = "Favori lig başarıyla silindi." });
        }
    }
}
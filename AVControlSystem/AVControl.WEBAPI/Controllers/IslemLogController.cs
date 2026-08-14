using AutoMapper;
using AVControl.Core.Dtos.IslemLogDtos;
using AVControl.Core.Entities;
using AVControl.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AVControl.WEBAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class IslemLogController : ControllerBase
    {
        private readonly IService<IslemLog> _service;
        private readonly IMapper _mapper;

        public IslemLogController(IService<IslemLog> service, IMapper mapper)
        {
            _service = service;
            _mapper = mapper;
        }

        [HttpGet("listele")]
        public async Task<IActionResult> TumunuGetir()
        {
            var data = await _service.TumunuGetirAsync();
            return Ok(_mapper.Map<IEnumerable<IslemLogListeDto>>(data));
        }
    }
}
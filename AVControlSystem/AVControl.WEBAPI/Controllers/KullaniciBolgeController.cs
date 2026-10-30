using AVControl.Core.Dtos.KullaniciBolgeDtos;
using AVControl.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AVControl.WEBAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class KullaniciBolgeController : ControllerBase
    {
        private readonly IBolgeYetkiService _yetkiService;

        public KullaniciBolgeController(IBolgeYetkiService yetkiService)
        {
            _yetkiService = yetkiService;
        }

        // Parametre olmadan: genel kurala gore normal kullaniciya atanabilir bolgeler.
        // ?kullaniciId=2: hedef kullanicinin rolune gore secilebilir bolgeler.
        [HttpGet("bolgeler")]
        public async Task<ActionResult<List<KullaniciBolgeListeDto>>> Bolgeler(
            [FromQuery] int? kullaniciId = null)
        {
            if (kullaniciId.HasValue &&
                !await _yetkiService.KullaniciVarMiAsync(kullaniciId.Value))
            {
                return NotFound(new { mesaj = "Kullanici bulunamadi." });
            }

            var bolgeler = await _yetkiService.SecilebilirBolgeleriGetirAsync(kullaniciId);
            return Ok(bolgeler);
        }

        // Daha once atanan tum ID'ler (gizli hale gelenler dahil) korunur.
        [HttpGet("kullanici/{kullaniciId:int}")]
        public async Task<ActionResult<KullaniciBolgeYetkiListeDto>> KullaniciYetkileri(
            int kullaniciId)
        {
            if (!await _yetkiService.KullaniciVarMiAsync(kullaniciId))
                return NotFound(new { mesaj = "Kullanici bulunamadi." });

            var ids = await _yetkiService.KullaniciBolgeIdleriGetirAsync(kullaniciId);
            return Ok(new KullaniciBolgeYetkiListeDto
            {
                KullaniciId = kullaniciId,
                BolgeIds = ids
            });
        }

        // Modalda secilebilen bolgeler tam liste olarak gonderilir.
        // Normal kullanicinin gizlenen eski bolgeleri silinmeden korunur.
        [HttpPut("kullanici/{kullaniciId:int}")]
        public async Task<IActionResult> YetkileriKaydet(
            int kullaniciId, [FromBody] KullaniciBolgeYetkiKaydetDto? request)
        {
            if (request?.BolgeIds == null)
                return BadRequest(new { mesaj = "bolgeIds listesi zorunludur." });

            var ids = request.BolgeIds.Distinct().ToArray();
            if (ids.Length > 500 || ids.Any(id => id <= 0))
                return BadRequest(new { mesaj = "Gecersiz bolge listesi." });

            if (!await _yetkiService.KullaniciVarMiAsync(kullaniciId))
                return NotFound(new { mesaj = "Kullanici bulunamadi." });

            if (!await _yetkiService.AtanabilirBolgeIdleriGecerliMiAsync(kullaniciId, ids))
            {
                return BadRequest(new
                {
                    mesaj = "Bu kullaniciya atanamayacak pasif veya kullaniciya kapali bolge var."
                });
            }

            try
            {
                await _yetkiService.KullaniciBolgeleriniKaydetAsync(kullaniciId, ids);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { mesaj = ex.Message });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { mesaj = "Kullanici bulunamadi." });
            }

            return Ok(new
            {
                mesaj = "Bolge yetkileri kaydedildi.",
                kullaniciId,
                // Gercek persisted listeyi donduruyoruz; gizli eski atamalar korunur.
                bolgeIds = await _yetkiService.KullaniciBolgeIdleriGetirAsync(kullaniciId)
            });
        }
    }
}

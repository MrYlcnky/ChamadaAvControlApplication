using AVControl.Core.Dtos.Orchestration;
using AVControl.Core.Entities;
using AVControl.Core.Interfaces;
using AVControl.Service.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AVControl.WEBAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OrchestrationController : ControllerBase
    {
        private readonly IAVOrchestrationService _orchestrationService;
        private readonly IDeviceCommandService _commandService;
        private readonly IService<IrTransmitter> _piService;
        private readonly IMatrixDeviceService _matrixDeviceService;

        private readonly NovastarService _novastarService;
        private readonly ILedProcessorService _ledProcessorService;
        private readonly IOutputZoneService _outputZoneService;
        private readonly IRemoteControlService _remoteControlService;

        public OrchestrationController(
            IAVOrchestrationService orchestrationService,
            IDeviceCommandService commandService,
            IService<IrTransmitter> piService,
            IMatrixDeviceService matrixDeviceService,
            NovastarService novastarService,
            ILedProcessorService ledProcessorService,
            IOutputZoneService outputZoneService,
            IRemoteControlService remoteControlService)
        {
            _orchestrationService = orchestrationService;
            _commandService = commandService;
            _piService = piService;
            _matrixDeviceService = matrixDeviceService;
            _novastarService = novastarService;
            _ledProcessorService = ledProcessorService;
            _outputZoneService = outputZoneService;
            _remoteControlService = remoteControlService;
        }

        // ------------------------------------------------------------
        // KAYNAK DEĞİŞTİR
        // ------------------------------------------------------------

        [HttpPost("kaynak-degistir")]
        public async Task<IActionResult> KaynakDegistir(
            [FromBody] KaynakDegistirRequestDto request)
        {
            var sonuc = await _orchestrationService.KaynakDegistirAsync(
                request.OutputZoneId,
                request.InputSourceId,
                request.KullaniciId);

            if (sonuc)
            {
                return Ok(new
                {
                    mesaj = "Kaynak başarıyla değiştirildi."
                });
            }

            return BadRequest(new
            {
                mesaj = "Kaynak değiştirilemedi. Cihaz bağlantılarını kontrol edin."
            });
        }

        // ------------------------------------------------------------
        // KANAL DEĞİŞTİR
        // ------------------------------------------------------------

        [HttpPost("kanal-degistir")]
        public async Task<IActionResult> KanalDegistir(
            [FromBody] KanalDegistirRequestDto request)
        {
            var sonuc = await _orchestrationService.KanalDegistirAsync(
                request.OutputZoneId,
                request.ChannelListId,
                request.KullaniciId);

            if (sonuc)
            {
                return Ok(new
                {
                    mesaj = "Kanal başarıyla değiştirildi."
                });
            }

            return BadRequest(new
            {
                mesaj = "Kanal değiştirilemedi."
            });
        }

        // ------------------------------------------------------------
        // TEKİL TUŞ GÖNDER
        // ------------------------------------------------------------

        [HttpPost("tekil-tus")]
        public async Task<IActionResult> TekilTusGonder(
            [FromBody] TekilTusGonderRequestDto request)
        {
            var sonuc = await _orchestrationService.TekilTusGonderAsync(
                request.OutputZoneId,
                request.TusKodu,
                request.KullaniciId,
                request.TvKontroluMu);

            if (sonuc)
            {
                return Ok(new
                {
                    mesaj = "Komut başarıyla gönderildi."
                });
            }

            return BadRequest(new
            {
                mesaj = "Komut gönderilemedi."
            });
        }

        // ------------------------------------------------------------
        // IR SİNYAL ÖĞREN
        // ------------------------------------------------------------

        [HttpPost("LearnSignal")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> LearnSignal(
            [FromBody] LearnSignalRequestDto request)
        {
            var pi = await _piService.IdyeGoreGetirAsync(request.PiId);

            if (pi == null)
            {
                return NotFound(new
                {
                    mesaj = "Dinleme yapılacak Pi cihazı bulunamadı."
                });
            }

            var rawData =
                await _commandService.LearnIrCommandAsync(pi.IpAdresi);

            if (string.IsNullOrEmpty(rawData))
            {
                return BadRequest(new
                {
                    mesaj = "Sinyal okunamadı."
                });
            }

            return Ok(new
            {
                rawDataJson = rawData
            });
        }

        // ------------------------------------------------------------
        // MATRIX CANLI DURUM
        // ------------------------------------------------------------

        [HttpGet("matrix-durum/{matrixId}")]
        public async Task<IActionResult> GetMatrixDurum(int matrixId)
        {
            var cihaz =
                await _matrixDeviceService.IdyeGoreGetirAsync(matrixId);

            if (cihaz == null)
            {
                return NotFound(new
                {
                    mesaj = "Cihaz bulunamadı."
                });
            }

            var durum =
                await _commandService.GetMatrixLiveStatusAsync(cihaz);

            return Ok(durum);
        }

        // ------------------------------------------------------------
        // KONTROL PANELİ KUMANDALARI
        // ------------------------------------------------------------

        [HttpGet("kontrol-paneli-kumandalar")]
        public async Task<IActionResult> GetKontrolPaneliKumandalar()
        {
            var kumandalar =
                await _remoteControlService
                    .KontrolPaneliKumandalariniGetirAsync();

            return Ok(kumandalar);
        }


        // ------------------------------------------------------------
        // KONTROL PANELİ KUMANDA TUŞ GÖNDER
        // ------------------------------------------------------------

        [HttpPost("kontrol-paneli-kumanda-tus-gonder")]
        public async Task<IActionResult> KontrolPaneliKumandaTusGonder(
            [FromBody] KontrolPaneliKumandaTusGonderRequestDto request)
        {
            if (request.RemoteControlId <= 0)
            {
                return BadRequest(new
                {
                    mesaj = "Geçerli bir kumanda seçilmelidir."
                });
            }

            if (request.IrTransmitterId <= 0)
            {
                return BadRequest(new
                {
                    mesaj = "Geçerli bir IR verici seçilmelidir."
                });
            }

            if (string.IsNullOrWhiteSpace(request.TusKodu))
            {
                return BadRequest(new
                {
                    mesaj = "Tuş kodu boş olamaz."
                });
            }

            var sonuc =
                await _orchestrationService.KontrolPaneliKumandaTusGonderAsync(
                    request.RemoteControlId,
                    request.IrTransmitterId,
                    request.TusKodu,
                    request.KullaniciId);

            if (sonuc)
            {
                return Ok(new
                {
                    mesaj = "Kumanda komutu başarıyla gönderildi."
                });
            }

            return BadRequest(new
            {
                mesaj =
                    "Kumanda komutu gönderilemedi. Kumanda, tuş veya IR verici eşleşmesini kontrol edin."
            });
        }
        // ------------------------------------------------------------
        // KONTROL PANELİ BÖLGELERİ
        // ------------------------------------------------------------

        [HttpGet("kontrol-paneli-bolgeler")]
        public async Task<IActionResult> GetControlPanelZones()
        {
            var userRole = User.Claims
                .FirstOrDefault(c => c.Type == ClaimTypes.Role)
                ?.Value;

            var zones =
                await _outputZoneService.TumunuGetirAsync();

            var allLedProcessors =
                await _ledProcessorService.TumunuGetirAsync();

            var result = zones.Select(z =>
            {
                var led = z.LedProcessorId != null
                    ? allLedProcessors.FirstOrDefault(
                        l => l.Id == z.LedProcessorId)
                    : null;

                return new
                {
                    z.Id,
                    z.BolgeAdi,
                    z.MatrixDeviceId,
                    z.PortKodu,
                    z.AktifMi,
                    z.RemoteControlId,
                    z.GuncelInputSourceId,
                    z.GuncelChannelListId,
                    z.LedProcessorId,
                    z.IrTransmitterId,

                    LedProcessorAdi =
                        led != null
                            ? led.CihazAdi
                            : null,

                    ViplexKontroluVarMi =
                        led != null &&
                        led.ViplexKontroluVarMi,

                    KullanicidaGosterilsinMi =
                        led == null ||
                        led.KullanicidaGosterilsinMi,

                    CihazGorselUrl =
                        led != null
                            ? led.CihazGorselUrl
                            : null
                };
            }).ToList();

            // Admin tüm bölgeleri görür
            if (userRole == "Admin" || userRole == "1")
            {
                return Ok(result);
            }

            // Kullanıcı yalnızca gösterilmesi izin verilen bölgeleri görür
            if (userRole == "Kullanici" || userRole == "2")
            {
                var kullaniciResult = result
                    .Where(x => x.KullanicidaGosterilsinMi)
                    .ToList();

                return Ok(kullaniciResult);
            }

            return Ok(new List<object>());
        }

        // ------------------------------------------------------------
        // MANUEL LED / VIPLEX MODU
        // ------------------------------------------------------------

        [HttpPost("manuel-led-modu")]
        public async Task<IActionResult> ChangeLedMode(
            [FromBody] ChangeLedModeDto request)
        {
            var led =
                await _ledProcessorService
                    .IdyeGoreGetirAsync(request.LedProcessorId);

            if (led == null || !led.ViplexKontroluVarMi)
            {
                return BadRequest(new
                {
                    mesaj =
                        "Bu işlemcide ViPlex kontrolü aktif değil veya cihaz bulunamadı."
                });
            }

            var (success, message) =
                await _novastarService.SwitchSourceAsync(
                    led,
                    request.TargetMode);

            if (success)
            {
                return Ok(new
                {
                    mesaj = "Ekran modu başarıyla değiştirildi."
                });
            }

            return BadRequest(new
            {
                mesaj = message
            });
        }

        // ------------------------------------------------------------
        // TOPLU KAYNAK DEĞİŞTİR
        // ------------------------------------------------------------

        [HttpPost("toplu-kaynak-degistir")]
        public async Task<IActionResult> TopluKaynakDegistir(
            [FromBody] TopluKaynakDegistirRequestDto request)
        {
            if (request.OutputZoneIds == null ||
                !request.OutputZoneIds.Any())
            {
                return BadRequest(new
                {
                    mesaj =
                        "Lütfen işlem yapılacak en az bir bölge seçin."
                });
            }

            var sonuc =
                await _orchestrationService.TopluKaynakDegistirAsync(
                    request.OutputZoneIds,
                    request.InputSourceId,
                    request.KullaniciId);

            if (sonuc)
            {
                return Ok(new
                {
                    mesaj =
                        "Seçilen tüm bölgelerin yayını başarıyla değiştirildi."
                });
            }

            return Ok(new
            {
                mesaj =
                    "İşlem tamamlandı, ancak bazı bölgelere yayın gönderilirken bağlantı sorunu yaşanmış olabilir."
            });
        }
    }

    public class ChangeLedModeDto
    {
        public int LedProcessorId { get; set; }

        public int TargetMode { get; set; }
    }
}
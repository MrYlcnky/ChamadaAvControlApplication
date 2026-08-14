using AVControl.Core.Entities;
using AVControl.Core.Interfaces;
using System.Threading;

namespace AVControl.Service.Services
{
    public class AVOrchestrationService : IAVOrchestrationService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IDeviceCommandService _commandService;
        private readonly IGenericRepository<OutputZone> _outputRepo;
        private readonly IGenericRepository<InputSource> _inputRepo;
        private readonly IGenericRepository<MatrixDevice> _matrixRepo;
        private readonly IGenericRepository<ChannelList> _channelRepo;
        private readonly IGenericRepository<RemoteButton> _buttonRepo;
        private readonly IGenericRepository<IrTransmitter> _piRepo;
        private readonly IGenericRepository<IslemLog> _logRepo;
        private readonly IGenericRepository<LedProcessor> _ledRepo;
        private readonly NovastarService _novastarService;

        // ÖNEMLİ: Telnet isteklerinin üst üste binip cihazı kilitlemesini önleyen kilit (Semaphore).
        // Static tanımlanır ki tüm uygulama genelinde Matrix'e giden istekler tek bir sıraya girsin.
        private static readonly SemaphoreSlim _telnetSemafor = new SemaphoreSlim(1, 1);

        public AVOrchestrationService(
            IUnitOfWork unitOfWork,
            IDeviceCommandService commandService,
            IGenericRepository<OutputZone> outputRepo,
            IGenericRepository<InputSource> inputRepo,
            IGenericRepository<MatrixDevice> matrixRepo,
            IGenericRepository<ChannelList> channelRepo,
            IGenericRepository<RemoteButton> buttonRepo,
            IGenericRepository<IrTransmitter> piRepo,
            IGenericRepository<IslemLog> logRepo,
            IGenericRepository<LedProcessor> ledRepo,
            NovastarService novastarService)
        {
            _unitOfWork = unitOfWork;
            _commandService = commandService;
            _outputRepo = outputRepo;
            _inputRepo = inputRepo;
            _matrixRepo = matrixRepo;
            _channelRepo = channelRepo;
            _buttonRepo = buttonRepo;
            _piRepo = piRepo;
            _logRepo = logRepo;
            _ledRepo = ledRepo;
            _novastarService = novastarService;
        }

        // 1. KAYNAK DEĞİŞTİRME (Gefen Matrix Kontrolü ve Novastar Otomasyonu)
        public async Task<bool> KaynakDegistirAsync(int outputZoneId, int inputSourceId, int kullaniciId)
        {
            var output = await _outputRepo.IdyeGoreGetirAsync(outputZoneId);
            var input = await _inputRepo.IdyeGoreGetirAsync(inputSourceId);

            if (output == null || input == null) return false;

            // 1. MATRIX GEÇİŞİ
            var matrix = await _matrixRepo.IdyeGoreGetirAsync(output.MatrixDeviceId);
            if (matrix == null) return false;

            bool success = false;

            // SEMAPHORE BAŞLANGICI: Telnet işlemi başlıyor. Eğer başka bir istek çalışıyorsa, bitene kadar bekler.
            await _telnetSemafor.WaitAsync();
            try
            {
                success = await _commandService.SwitchMatrixRouteAsync(
                    matrix.IpAdresi, matrix.TelnetPort, input.PortNumarasi.ToString(), output.PortKodu);

                // Tek kaynak değiştirilirken bile cihazın komutu işleyip nefes alması için 300ms bekle (Boğulmayı önler)
                await Task.Delay(1000);
            }
            finally
            {
                // İşlem bitince sıradaki isteğe izin ver
                _telnetSemafor.Release();
            }

            if (success)
            {
                // 2. OTOMASYON: Novastar varsa ve ViPlex kontrolü aktifse
                if (output.LedProcessorId.HasValue)
                {
                    var led = await _ledRepo.IdyeGoreGetirAsync(output.LedProcessorId.Value);

                    if (led != null && led.ViplexKontroluVarMi)
                    {
                        int mode = input.InputName.ToLower().Contains("jackpot") ? 1 : 2;

                        _ = Task.Run(async () =>
                        {
                            // Eğer HDMI'a (TV) geçiliyorsa, Matrix'in sinyali toparlaması için bekle
                            if (mode == 2)
                            {
                                await Task.Delay(3000);
                            }

                            await _novastarService.SwitchSourceAsync(led, mode);
                        });
                    }
                }

                // 3. Durum güncelleme ve Log
                output.GuncelInputSourceId = inputSourceId;
                _outputRepo.Guncelle(output);

                await _logRepo.EkleAsync(new IslemLog
                {
                    KullaniciId = kullaniciId,
                    IslemTipi = "Kaynak Değişimi",
                    Detaylar = $"{output.BolgeAdi} -> {input.InputName}"
                });
                await _unitOfWork.KaydetAsync();
            }
            return success;
        }

        // YENİ EKLENEN METOT: Toplu Kaynak Değişimi
        public async Task<bool> TopluKaynakDegistirAsync(List<int> outputZoneIds, int inputSourceId, int kullaniciId)
        {
            bool allSuccess = true;

            foreach (var zoneId in outputZoneIds)
            {
                // KaynakDegistirAsync zaten kendi içinde Semaphore barındırdığı için güvenli.
                bool result = await KaynakDegistirAsync(zoneId, inputSourceId, kullaniciId);

                if (!result)
                {
                    allSuccess = false;
                }

                // ÖNEMLİ: Toplu işlemlerde senin de dediğin gibi "tane tane" gitmesi çok kritik.
                // Matrix'e üst üste paket gönderip çökmesini engellemek için araya 800 milisaniye (0.8 sn) es koyuyoruz.
                // Bu süreyi matrix cihazının hızına göre 500ms ile 1000ms arası değiştirebilirsin.
                await Task.Delay(1500);
            }

            return allSuccess;
        }

        // 2. KANAL DEĞİŞTİRME (Raspberry Pi IR Kontrolü)
        public async Task<bool> KanalDegistirAsync(int outputZoneId, int channelListId, int kullaniciId)
        {
            var output = await _outputRepo.IdyeGoreGetirAsync(outputZoneId);
            var channel = await _channelRepo.IdyeGoreGetirAsync(channelListId);

            if (output == null || channel == null) return false;

            var input = await _inputRepo.IdyeGoreGetirAsync(channel.InputSourceId);

            if (input?.IrTransmitterId == null || input.RemoteControlId == null) return false;

            var pi = await _piRepo.IdyeGoreGetirAsync(input.IrTransmitterId.Value);
            if (pi == null) return false;

            string kanalRakamlari = channel.KanalNumarasi.ToString();
            bool allSuccess = true;

            foreach (char rakam in kanalRakamlari)
            {
                string tusAdi = rakam.ToString();

                var tus = (await _buttonRepo.KosulaGoreGetirAsync(x =>
                    x.RemoteControlId == input.RemoteControlId &&
                    (x.TusKodu == tusAdi || x.TusKodu.ToUpper() == "NUM_" + tusAdi)
                )).FirstOrDefault();

                if (tus?.RawDataJson != null)
                {
                    bool result = await _commandService.SendIrCommandAsync(pi.IpAdresi, tus.RawDataJson);
                    if (!result) allSuccess = false;
                    await Task.Delay(300); // Rakamlar arası 300ms bekleme
                }
            }

            // En son "OK" tuşunu yolluyoruz
            var okTus = (await _buttonRepo.KosulaGoreGetirAsync(x =>
                x.RemoteControlId == input.RemoteControlId &&
                (x.TusKodu.ToUpper() == "OK" || x.TusKodu.ToUpper() == "ENTER")
            )).FirstOrDefault();

            if (okTus?.RawDataJson != null)
            {
                await Task.Delay(200);
                await _commandService.SendIrCommandAsync(pi.IpAdresi, okTus.RawDataJson);
            }

            if (allSuccess)
            {
                output.GuncelChannelListId = channelListId;
                output.GuncelInputSourceId = channel.InputSourceId;

                _outputRepo.Guncelle(output);

                await _logRepo.EkleAsync(new IslemLog
                {
                    KullaniciId = kullaniciId,
                    IslemTipi = "Kanal Değişimi",
                    Detaylar = $"{output.BolgeAdi} ekranında kanal '{channel.KanalAdi}' olarak değiştirildi."
                });

                await _unitOfWork.KaydetAsync();
            }

            return allSuccess;
        }

        // 3. TEKİL TUŞ GÖNDERME (Ses Açma, Kapatma, Menü vb.)
        public async Task<bool> TekilTusGonderAsync(int outputZoneId, string tusKodu, int kullaniciId, bool tvKontroluMu = false)
        {
            var output = await _outputRepo.IdyeGoreGetirAsync(outputZoneId);
            if (output == null) return false;

            int? hedefPiId = null;
            int? hedefKumandaId = null;

            if (tvKontroluMu)
            {
                hedefPiId = output.IrTransmitterId;
                hedefKumandaId = output.RemoteControlId;
            }
            else
            {
                if (output.GuncelInputSourceId == null) return false;
                var input = await _inputRepo.IdyeGoreGetirAsync(output.GuncelInputSourceId.Value);

                hedefPiId = input?.IrTransmitterId;
                hedefKumandaId = input?.RemoteControlId;
            }

            if (hedefPiId == null || hedefKumandaId == null) return false;

            var pi = await _piRepo.IdyeGoreGetirAsync(hedefPiId.Value);
            var tus = (await _buttonRepo.KosulaGoreGetirAsync(x => x.RemoteControlId == hedefKumandaId.Value && x.TusKodu == tusKodu)).FirstOrDefault();

            if (pi == null || tus?.RawDataJson == null) return false;

            bool success = await _commandService.SendIrCommandAsync(pi.IpAdresi, tus.RawDataJson);

            if (success)
            {
                await _logRepo.EkleAsync(new IslemLog
                {
                    KullaniciId = kullaniciId,
                    IslemTipi = tvKontroluMu ? "TV Kontrolü" : "Kaynak Kontrolü",
                    Detaylar = $"{output.BolgeAdi} bölgesine '{tusKodu}' tuş komutu gönderildi."
                });
                await _unitOfWork.KaydetAsync();
            }

            return success;
        }
    }
}
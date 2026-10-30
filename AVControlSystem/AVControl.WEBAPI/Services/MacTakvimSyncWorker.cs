
using AVControl.Core.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Globalization;

namespace AVControl.WEBAPI.Services
{
    public sealed class MacTakvimSyncWorker : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<MacTakvimSyncWorker> _logger;

        private static readonly TimeSpan SyncInterval =
            TimeSpan.FromMinutes(3);

        public MacTakvimSyncWorker(
            IServiceScopeFactory scopeFactory,
            ILogger<MacTakvimSyncWorker> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(
            CancellationToken stoppingToken)
        {
            _logger.LogInformation(
                "Maç takvimi otomatik senkronizasyonu başlatıldı."
            );

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();

                    var service =
                        scope.ServiceProvider
                            .GetRequiredService<IMacTakvimService>();

                    string tarih = DateTime.Now.ToString(
                        "dd/MM/yyyy",
                        CultureInfo.InvariantCulture
                    );

                    await service.VerileriSenkronizeEtAsync(tarih);

                    _logger.LogInformation(
                        "Maç takvimi güncellendi: {Tarih}",
                        tarih
                    );
                }
                catch (OperationCanceledException)
                    when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex,
                        "Maç takvimi otomatik güncelleme hatası."
                    );
                }

                try
                {
                    await Task.Delay(
                        SyncInterval,
                        stoppingToken
                    );
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }
    }
}

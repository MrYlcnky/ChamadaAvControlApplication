using AVControl.Core.Dtos.Orchestration;
using AVControl.Core.Entities;
using AVControl.Core.Interfaces;

namespace AVControl.Service.Services
{
    public class RemoteControlService : GenericService<RemoteControl>, IRemoteControlService
    {
        private readonly IGenericRepository<InputSource> _inputSourceRepository;
        private readonly IGenericRepository<OutputZone> _outputZoneRepository;
        private readonly IGenericRepository<IrTransmitter> _irTransmitterRepository;

        public RemoteControlService(
            IGenericRepository<RemoteControl> repository,
            IUnitOfWork unitOfWork,
            IGenericRepository<InputSource> inputSourceRepository,
            IGenericRepository<OutputZone> outputZoneRepository,
            IGenericRepository<IrTransmitter> irTransmitterRepository)
            : base(repository, unitOfWork)
        {
            _inputSourceRepository = inputSourceRepository;
            _outputZoneRepository = outputZoneRepository;
            _irTransmitterRepository = irTransmitterRepository;
        }

        public override async Task<RemoteControl> EkleAsync(RemoteControl entity)
        {
            var ayniKumandaVarMi =
                (await _repository.KosulaGoreGetirAsync(
                    x => x.KumandaMarkaModel == entity.KumandaMarkaModel))
                .Any();

            if (ayniKumandaVarMi)
            {
                throw new Exception(
                    "Bu marka ve modele sahip bir kumanda zaten kayıtlı!");
            }

            return await base.EkleAsync(entity);
        }

        public override async Task GuncelleAsync(RemoteControl entity)
        {
            var ayniKumandaVarMi =
                (await _repository.KosulaGoreGetirAsync(
                    x =>
                        x.KumandaMarkaModel == entity.KumandaMarkaModel &&
                        x.Id != entity.Id))
                .Any();

            if (ayniKumandaVarMi)
            {
                throw new Exception(
                    "Bu marka/model adı başka bir kumanda profili tarafından kullanılıyor!");
            }

            await base.GuncelleAsync(entity);
        }

        public async Task<IEnumerable<KontrolPaneliKumandaListeDto>>
            KontrolPaneliKumandalariniGetirAsync()
        {
            var kumandalar = (await _repository.TumunuGetirAsync())
                .Where(x => x.AktifMi)
                .ToList();

            var inputSources =
                (await _inputSourceRepository.TumunuGetirAsync())
                .Where(x =>
                    x.AktifMi &&
                    x.RemoteControlId.HasValue &&
                    x.IrTransmitterId.HasValue)
                .ToList();

            var outputZones =
                (await _outputZoneRepository.TumunuGetirAsync())
                .Where(x =>
                    x.AktifMi &&
                    x.RemoteControlId.HasValue &&
                    x.IrTransmitterId.HasValue)
                .ToList();

            var irTransmitters =
                (await _irTransmitterRepository.TumunuGetirAsync())
                .Where(x => x.AktifMi)
                .ToDictionary(x => x.Id);

            var sonuc = new List<KontrolPaneliKumandaListeDto>();

            foreach (var kumanda in kumandalar)
            {
                var hedefler = new List<KontrolPaneliKumandaHedefDto>();

                // InputSource üzerinden bağlı kumandalar
                var bagliInputlar = inputSources
                    .Where(x => x.RemoteControlId == kumanda.Id)
                    .ToList();

                foreach (var input in bagliInputlar)
                {
                    if (!input.IrTransmitterId.HasValue)
                        continue;

                    if (!irTransmitters.TryGetValue(
                            input.IrTransmitterId.Value,
                            out var irTransmitter))
                    {
                        continue;
                    }

                    hedefler.Add(new KontrolPaneliKumandaHedefDto
                    {
                        IrTransmitterId = irTransmitter.Id,
                        IrTransmitterAdi = irTransmitter.CihazAdi,
                        KaynakAdi = input.InputName,
                        BolgeAdi = null
                    });
                }

                // OutputZone üzerinden bağlı TV kumandaları
                var bagliBolgeler = outputZones
                    .Where(x => x.RemoteControlId == kumanda.Id)
                    .ToList();

                foreach (var zone in bagliBolgeler)
                {
                    if (!zone.IrTransmitterId.HasValue)
                        continue;

                    if (!irTransmitters.TryGetValue(
                            zone.IrTransmitterId.Value,
                            out var irTransmitter))
                    {
                        continue;
                    }

                    hedefler.Add(new KontrolPaneliKumandaHedefDto
                    {
                        IrTransmitterId = irTransmitter.Id,
                        IrTransmitterAdi = irTransmitter.CihazAdi,
                        KaynakAdi = null,
                        BolgeAdi = zone.BolgeAdi
                    });
                }

                // Aynı hedef birden fazla kez oluşmuşsa tekrarı temizle
                hedefler = hedefler
                    .GroupBy(x => new
                    {
                        x.IrTransmitterId,
                        x.KaynakAdi,
                        x.BolgeAdi
                    })
                    .Select(x => x.First())
                    .ToList();

                // Hiçbir IR vericiyle ilişkisi yoksa kontrol panelinde gösterme
                if (hedefler.Count == 0)
                    continue;

                sonuc.Add(new KontrolPaneliKumandaListeDto
                {
                    RemoteControlId = kumanda.Id,
                    CihazTipi = kumanda.CihazTipi,
                    KumandaMarkaModel = kumanda.KumandaMarkaModel,
                    ProtokolTipi = kumanda.ProtokolTipi,
                    Hedefler = hedefler
                });
            }

            return sonuc
                .OrderBy(x => x.KumandaMarkaModel)
                .ToList();
        }
    }
}
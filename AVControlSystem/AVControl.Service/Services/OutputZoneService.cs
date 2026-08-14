using AVControl.Core.Entities;
using AVControl.Core.Interfaces;

namespace AVControl.Service.Services
{
    public class OutputZoneService : GenericService<OutputZone>, IOutputZoneService
    {
        public OutputZoneService(IGenericRepository<OutputZone> repository, IUnitOfWork unitOfWork) : base(repository, unitOfWork) { }

        public override async Task<OutputZone> EkleAsync(OutputZone entity)
        {
            if ((await _repository.KosulaGoreGetirAsync(x => x.MatrixDeviceId == entity.MatrixDeviceId && x.PortKodu == entity.PortKodu)).Any())
                throw new Exception($"Seçilen Matrix cihazının {entity.PortKodu} çıkışı zaten kullanımda!");

            return await base.EkleAsync(entity);
        }

        public override async Task GuncelleAsync(OutputZone entity)
        {
            if ((await _repository.KosulaGoreGetirAsync(x => x.MatrixDeviceId == entity.MatrixDeviceId && x.PortKodu == entity.PortKodu && x.Id != entity.Id)).Any())
                throw new Exception($"Bu çıkış portu başka bir bölgeye tanımlı!");

            await base.GuncelleAsync(entity);
        }
    }
}
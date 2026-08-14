using AVControl.Core.Entities;
using AVControl.Core.Interfaces;

namespace AVControl.Service.Services
{
    public class RemoteButtonService : GenericService<RemoteButton>, IRemoteButtonService
    {
        public RemoteButtonService(IGenericRepository<RemoteButton> repository, IUnitOfWork unitOfWork) : base(repository, unitOfWork) { }

        public override async Task<RemoteButton> EkleAsync(RemoteButton entity)
        {
            if ((await _repository.KosulaGoreGetirAsync(x => x.RemoteControlId == entity.RemoteControlId && x.TusKodu == entity.TusKodu)).Any())
                throw new Exception($"Bu kumandada '{entity.TusKodu}' tuşu zaten tanımlanmış!");

            return await base.EkleAsync(entity);
        }

        public override async Task GuncelleAsync(RemoteButton entity)
        {
            if ((await _repository.KosulaGoreGetirAsync(x => x.RemoteControlId == entity.RemoteControlId && x.TusKodu == entity.TusKodu && x.Id != entity.Id)).Any())
                throw new Exception($"Bu tuş kodu bu kumandada zaten var!");

            await base.GuncelleAsync(entity);
        }
    }
}
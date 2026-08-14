using AVControl.Core.Entities;
using AVControl.Core.Interfaces;

namespace AVControl.Service.Services
{
    public class RemoteControlService : GenericService<RemoteControl>, IRemoteControlService
    {
        public RemoteControlService(IGenericRepository<RemoteControl> repository, IUnitOfWork unitOfWork) : base(repository, unitOfWork) { }

        public override async Task<RemoteControl> EkleAsync(RemoteControl entity)
        {
            if ((await _repository.KosulaGoreGetirAsync(x => x.KumandaMarkaModel == entity.KumandaMarkaModel)).Any())
                throw new Exception("Bu marka ve modele sahip bir kumanda zaten kayıtlı!");

            return await base.EkleAsync(entity);
        }

        public override async Task GuncelleAsync(RemoteControl entity)
        {
            if ((await _repository.KosulaGoreGetirAsync(x => x.KumandaMarkaModel == entity.KumandaMarkaModel && x.Id != entity.Id)).Any())
                throw new Exception("Bu marka/model adı başka bir kumanda profili tarafından kullanılıyor!");

            await base.GuncelleAsync(entity);
        }
    }
}
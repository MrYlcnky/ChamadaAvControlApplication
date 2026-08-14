using AVControl.Core.Entities;
using AVControl.Core.Interfaces;

namespace AVControl.Service.Services
{
    public class LedProcessorService : GenericService<LedProcessor>, ILedProcessorService
    {
        public LedProcessorService(IGenericRepository<LedProcessor> repository, IUnitOfWork unitOfWork) : base(repository, unitOfWork) { }

        public override async Task<LedProcessor> EkleAsync(LedProcessor entity)
        {
            if ((await _repository.KosulaGoreGetirAsync(x => x.IpAdresi == entity.IpAdresi)).Any())
                throw new Exception("Bu IP adresine sahip bir LED İşlemci zaten kayıtlı!");

            return await base.EkleAsync(entity);
        }

        public override async Task GuncelleAsync(LedProcessor entity)
        {
            if ((await _repository.KosulaGoreGetirAsync(x => x.IpAdresi == entity.IpAdresi && x.Id != entity.Id)).Any())
                throw new Exception("Bu IP adresi başka bir LED İşlemciye ait!");

            await base.GuncelleAsync(entity);
        }
    }
}
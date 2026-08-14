using AVControl.Core.Entities;
using AVControl.Core.Interfaces;

namespace AVControl.Service.Services
{
    public class IrTransmitterService : GenericService<IrTransmitter>, IIrTransmitterService
    {
        public IrTransmitterService(IGenericRepository<IrTransmitter> repository, IUnitOfWork unitOfWork) : base(repository, unitOfWork) { }

        public override async Task<IrTransmitter> EkleAsync(IrTransmitter entity)
        {
            if ((await _repository.KosulaGoreGetirAsync(x => x.IpAdresi == entity.IpAdresi)).Any())
                throw new Exception("Bu IP adresine sahip başka bir IR Verici (Pi) zaten var!");

            return await base.EkleAsync(entity);
        }

        public override async Task GuncelleAsync(IrTransmitter entity)
        {
            if ((await _repository.KosulaGoreGetirAsync(x => x.IpAdresi == entity.IpAdresi && x.Id != entity.Id)).Any())
                throw new Exception("Bu IP adresi başka bir cihazda kullanılıyor!");

            await base.GuncelleAsync(entity);
        }
    }
}
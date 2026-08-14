using AVControl.Core.Entities;
using AVControl.Core.Interfaces;

namespace AVControl.Service.Services
{
    public class MatrixDeviceService : GenericService<MatrixDevice>, IMatrixDeviceService
    {
        public MatrixDeviceService(IGenericRepository<MatrixDevice> repository, IUnitOfWork unitOfWork) : base(repository, unitOfWork) { }

        public override async Task<MatrixDevice> EkleAsync(MatrixDevice entity)
        {
            if ((await _repository.KosulaGoreGetirAsync(x => x.IpAdresi == entity.IpAdresi)).Any())
                throw new Exception("Bu IP adresine sahip başka bir Matrix cihazı zaten kayıtlı!");

            if ((await _repository.KosulaGoreGetirAsync(x => x.CihazAdi == entity.CihazAdi)).Any())
                throw new Exception("Bu isimde bir Matrix cihazı zaten var!");

            return await base.EkleAsync(entity);
        }

        public override async Task GuncelleAsync(MatrixDevice entity)
        {
            if ((await _repository.KosulaGoreGetirAsync(x => x.IpAdresi == entity.IpAdresi && x.Id != entity.Id)).Any())
                throw new Exception("Bu IP adresi başka bir Matrix cihazı tarafından kullanılıyor!");

            await base.GuncelleAsync(entity);
        }
    }
}
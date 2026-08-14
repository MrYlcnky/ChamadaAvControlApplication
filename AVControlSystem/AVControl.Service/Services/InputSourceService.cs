using AVControl.Core.Entities;
using AVControl.Core.Interfaces;

namespace AVControl.Service.Services
{
    public class InputSourceService : GenericService<InputSource>, IInputSourceService
    {
        public InputSourceService(IGenericRepository<InputSource> repository, IUnitOfWork unitOfWork) : base(repository, unitOfWork) { }

        public override async Task<InputSource> EkleAsync(InputSource entity)
        {
            // Aynı Gefen cihazının aynı portuna iki giriş bağlanamaz!
            if ((await _repository.KosulaGoreGetirAsync(x => x.MatrixDeviceId == entity.MatrixDeviceId && x.PortNumarasi == entity.PortNumarasi)).Any())
                throw new Exception($"Seçilen Matrix cihazının {entity.PortNumarasi}. portu zaten dolu!");

            return await base.EkleAsync(entity);
        }

        public override async Task GuncelleAsync(InputSource entity)
        {
            if ((await _repository.KosulaGoreGetirAsync(x => x.MatrixDeviceId == entity.MatrixDeviceId && x.PortNumarasi == entity.PortNumarasi && x.Id != entity.Id)).Any())
                throw new Exception($"Bu Matrix cihazının {entity.PortNumarasi}. portunda başka bir cihaz var!");

            await base.GuncelleAsync(entity);
        }
    }
}
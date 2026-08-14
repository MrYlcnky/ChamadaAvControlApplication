using AVControl.Core.Entities;
using AVControl.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AVControl.Service.Services
{
    public class ChannelListService : GenericService<ChannelList>, IChannelListService
    {
        public ChannelListService(IGenericRepository<ChannelList> repository, IUnitOfWork unitOfWork) : base(repository, unitOfWork) { }

        public override async Task<IEnumerable<ChannelList>> TumunuGetirAsync()
        {
            return await _repository.GetAll()
                .Include(x => x.InputSource)
                    .ThenInclude(i => i.MatrixDevice)
                .Include(x => x.InputSource)
                    .ThenInclude(i => i.IrTransmitter)
                .Include(x => x.InputSource)
                    .ThenInclude(i => i.RemoteControl)
                .ToListAsync();
        }

        public override async Task<ChannelList> EkleAsync(ChannelList entity)
        {
            if ((await _repository.KosulaGoreGetirAsync(x => x.InputSourceId == entity.InputSourceId && x.KanalNumarasi == entity.KanalNumarasi)).Any())
                throw new Exception($"Bu uyduda {entity.KanalNumarasi} numaralı kanal zaten kayıtlı!");

            return await base.EkleAsync(entity);
        }

        public override async Task GuncelleAsync(ChannelList entity)
        {
            if ((await _repository.KosulaGoreGetirAsync(x => x.InputSourceId == entity.InputSourceId && x.KanalNumarasi == entity.KanalNumarasi && x.Id != entity.Id)).Any())
                throw new Exception($"Bu kanal numarası başka bir kanalda kullanılıyor!");

            await base.GuncelleAsync(entity);
        }
    }
}
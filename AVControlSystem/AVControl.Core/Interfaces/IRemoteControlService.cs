using AVControl.Core.Dtos.Orchestration;
using AVControl.Core.Entities;

namespace AVControl.Core.Interfaces
{
    public interface IRemoteControlService : IService<RemoteControl>
    {

        Task<IEnumerable<KontrolPaneliKumandaListeDto>> KontrolPaneliKumandalariniGetirAsync();
    }
}
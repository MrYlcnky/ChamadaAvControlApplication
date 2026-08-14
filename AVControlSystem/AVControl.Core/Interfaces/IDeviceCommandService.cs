using AVControl.Core.Entities;

namespace AVControl.Core.Interfaces
{
    public interface IDeviceCommandService
    {
        // 1. Gefen Matrix cihazına IP üzerinden bağlanıp Port değiştirme komutu
        Task<bool> SwitchMatrixRouteAsync(string matrixIp, int telnetPort, string inputPort, string outputPort);

        // 2. Raspberry Pi'ye JSON formatındaki IR kodunu fırlatma komutu (Yeni Parametre: piIpAdresi)
        Task<bool> SendIrCommandAsync(string piIpAdresi, string rawDataJson);

        Task<string?> LearnIrCommandAsync(string piIpAdresi);

        Task<object> GetMatrixLiveStatusAsync(MatrixDevice device);
    }
}
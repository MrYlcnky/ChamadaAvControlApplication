namespace AVControl.Core.Interfaces
{
    public interface IAVOrchestrationService
    {
        // Bir ekranın (OutputZone) kaynağını (InputSource) değiştirir
        Task<bool> KaynakDegistirAsync(int outputZoneId, int inputSourceId, int kullaniciId);

        // Bir ekranın (OutputZone) o anki kaynağı üzerinden kanalını değiştirir
        Task<bool> KanalDegistirAsync(int outputZoneId, int channelListId, int kullaniciId);

        // Kumanda üzerinden direkt Ses Açma, Kapatma gibi tekil tuş vuruşları
        Task<bool> TekilTusGonderAsync(int outputZoneId, string tusKodu, int kullaniciId, bool tvKontroluMu = false);

        Task<bool> TopluKaynakDegistirAsync(List<int> outputZoneIds, int inputSourceId, int kullaniciId);

        // Kontrol panelindeki bağımsız kumandadan doğrudan IR komutu gönderir
        Task<bool> KontrolPaneliKumandaTusGonderAsync( int remoteControlId, int irTransmitterId, string tusKodu, int kullaniciId);
    }
}
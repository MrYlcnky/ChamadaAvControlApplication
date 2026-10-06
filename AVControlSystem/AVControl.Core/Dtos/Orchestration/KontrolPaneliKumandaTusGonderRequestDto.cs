namespace AVControl.Core.Dtos.Orchestration
{
    public class KontrolPaneliKumandaTusGonderRequestDto
    {
        public int RemoteControlId { get; set; }

        public int IrTransmitterId { get; set; }

        public required string TusKodu { get; set; }

        public int KullaniciId { get; set; }
    }
}
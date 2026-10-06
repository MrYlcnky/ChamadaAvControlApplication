namespace AVControl.Core.Dtos.Orchestration
{
    public class KontrolPaneliKumandaListeDto
    {
        public int RemoteControlId { get; set; }

        public required string CihazTipi { get; set; }

        public required string KumandaMarkaModel { get; set; }

        public string? ProtokolTipi { get; set; }

        public List<KontrolPaneliKumandaHedefDto> Hedefler { get; set; } = new();
    }

    public class KontrolPaneliKumandaHedefDto
    {
        public int IrTransmitterId { get; set; }

        public required string IrTransmitterAdi { get; set; }

        public string? KaynakAdi { get; set; }

        public string? BolgeAdi { get; set; }
    }
}
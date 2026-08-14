namespace AVControl.Core.Dtos.OutputZoneDtos
{
    public class OutputZoneEkleDto
    {
        public int MatrixDeviceId { get; set; }
        public int? LedProcessorId { get; set; }
        public required string PortKodu { get; set; }
        public required string BolgeAdi { get; set; }
        public bool AktifMi { get; set; }

        public int? RemoteControlId { get; set; } 
        public int? IrTransmitterId { get; set; } 
    }
}
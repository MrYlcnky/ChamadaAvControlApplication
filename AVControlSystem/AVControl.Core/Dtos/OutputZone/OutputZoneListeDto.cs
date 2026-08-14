namespace AVControl.Core.Dtos.OutputZoneDtos
{
    public class OutputZoneListeDto
    {
        public int Id { get; set; }
        public int MatrixDeviceId { get; set; }
        public string? MatrixDeviceAdi { get; set; }
        public int? LedProcessorId { get; set; }
        public string? LedProcessorAdi { get; set; }
        public required string PortKodu { get; set; }
        public required string BolgeAdi { get; set; }
        public int? GuncelInputSourceId { get; set; }
        public string? GuncelKaynakAdi { get; set; } // O an ekranda ne açık? (Örn: Digiturk 1)
        public int? GuncelChannelListId { get; set; }
        public string? GuncelKanalAdi { get; set; } // O an hangi kanalda? (Örn: Bein Sports)

        public int? RemoteControlId { get; set; }
        public string? RemoteControlAdi { get; set; } // Örn: Samsung TV Kumandası

        public int? IrTransmitterId { get; set; }
        public string? IrTransmitterAdi { get; set; }

        public bool AktifMi { get; set; }
        public bool ViplexKontroluVarMi { get; set; }
        public string? CihazGorselUrl { get; set; }
    }
}
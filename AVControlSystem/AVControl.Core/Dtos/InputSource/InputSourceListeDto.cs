namespace AVControl.Core.Dtos.InputSourceDtos
{
    public class InputSourceListeDto
    {
        public int Id { get; set; }
        public required string InputName { get; set; }
        public int MatrixDeviceId { get; set; }
        public string? MatrixDeviceAdi { get; set; } // React ekranında göstermek için (Gefen 1)
        public int? RemoteControlId { get; set; }
        public int? IrTransmitterId { get; set; }
        public string? IrTransmitterAdi { get; set; }
        public string? KumandaMarkaModel { get; set; } // React ekranında göstermek için (Apple TV Kumandası)
        public int PortNumarasi { get; set; }
        public bool KanalKontrolVarMi { get; set; }
        public bool AktifMi { get; set; }
    }
}
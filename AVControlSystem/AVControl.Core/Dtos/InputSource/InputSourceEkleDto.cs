namespace AVControl.Core.Dtos.InputSourceDtos
{
    public class InputSourceEkleDto
    {
        public required string InputName { get; set; }
        public int MatrixDeviceId { get; set; }
        public int? RemoteControlId { get; set; }
        public int? IrTransmitterId { get; set; }
        public int PortNumarasi { get; set; }
        public bool KanalKontrolVarMi { get; set; }

        public bool AktifMi { get; set; }
    }
}
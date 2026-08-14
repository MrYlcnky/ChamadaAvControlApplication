namespace AVControl.Core.Entities
{
    public class OutputZone : BaseEntity
    {
        public int MatrixDeviceId { get; set; }
        public int? LedProcessorId { get; set; }
        public required string PortKodu { get; set; }
        public required string BolgeAdi { get; set; }

        public int? GuncelInputSourceId { get; set; }
        public int? GuncelChannelListId { get; set; }

        public virtual MatrixDevice? MatrixDevice { get; set; }
        public virtual LedProcessor? LedProcessor { get; set; }

        public int? RemoteControlId { get; set; } 
        public int? IrTransmitterId { get; set; }
        public virtual RemoteControl? RemoteControl { get; set; }
        public virtual IrTransmitter? IrTransmitter { get; set; }
    }
}
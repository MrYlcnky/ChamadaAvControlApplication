namespace AVControl.Core.Entities
{
    public class InputSource : BaseEntity
    {
        public required string InputName { get; set; }
        public int MatrixDeviceId { get; set; }
        public int? RemoteControlId { get; set; }
        public int PortNumarasi { get; set; }
        public bool KanalKontrolVarMi { get; set; }

        public int? IrTransmitterId { get; set; }
        public virtual IrTransmitter? IrTransmitter { get; set; }
        public virtual MatrixDevice? MatrixDevice { get; set; }
        public virtual RemoteControl? RemoteControl { get; set; }
        public ICollection<ChannelList>? ChannelLists { get; set; }
    }
}
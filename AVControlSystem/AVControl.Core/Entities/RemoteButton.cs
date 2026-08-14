namespace AVControl.Core.Entities
{
    public class RemoteButton : BaseEntity
    {
        public int RemoteControlId { get; set; }
        public required string TusKodu { get; set; }
        public string? RawDataJson { get; set; }

        public virtual RemoteControl? RemoteControl { get; set; }
    }
}
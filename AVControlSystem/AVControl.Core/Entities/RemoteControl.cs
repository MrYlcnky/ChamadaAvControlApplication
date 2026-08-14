namespace AVControl.Core.Entities
{
    public class RemoteControl : BaseEntity
    {
        public required string CihazTipi { get; set; } // "Uydu", "Led", "Matrix" vb.
        public required string KumandaMarkaModel { get; set; }
        public string? ProtokolTipi { get; set; }

        public ICollection<RemoteButton>? RemoteButtons { get; set; }
        public ICollection<InputSource>? InputSources { get; set; }
    }
}
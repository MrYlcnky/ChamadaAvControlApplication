namespace AVControl.Core.Entities
{
    public class ChannelList : BaseEntity
    {
        public int InputSourceId { get; set; }
        public virtual InputSource? InputSource { get; set; }
        public int KanalNumarasi { get; set; }
        public required string KanalAdi { get; set; }
        public string? LogoUrl { get; set; }
        public bool KullanicidaGosterilsinMi { get; set; }

       
    }
}
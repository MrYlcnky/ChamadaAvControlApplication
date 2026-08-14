namespace AVControl.Core.Dtos.Orchestration
{
    public class TopluKaynakDegistirRequestDto
    {
        public List<int>? OutputZoneIds { get; set; }
        public int InputSourceId { get; set; }
        public int KullaniciId { get; set; }
    }
}
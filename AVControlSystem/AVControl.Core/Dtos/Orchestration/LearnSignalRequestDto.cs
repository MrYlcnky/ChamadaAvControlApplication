namespace AVControl.Core.Dtos.Orchestration
{
    public class LearnSignalRequestDto
    {
        public int PiId { get; set; }
        public int RemoteControlId { get; set; }
        public required string TusKodu { get; set; }
        public int Attempt { get; set; }
    }
}
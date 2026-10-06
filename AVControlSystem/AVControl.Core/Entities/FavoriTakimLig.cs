namespace AVControl.Core.Entities
{
    public class FavoriTakimLig : BaseEntity
    {
        public int FavoriTakimId { get; set; }

        public required string LigAdi { get; set; }

        public virtual FavoriTakim? FavoriTakim { get; set; }
    }
}
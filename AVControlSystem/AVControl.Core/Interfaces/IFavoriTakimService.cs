using AVControl.Core.Entities;

namespace AVControl.Core.Interfaces
{
    public interface IFavoriTakimService : IService<FavoriTakim>
    {
        Task<IEnumerable<FavoriTakim>> TumunuLigleriyleGetirAsync();

        Task<FavoriTakim?> IdyeGoreLigleriyleGetirAsync(int id);

        Task<FavoriTakim> EkleLigleriyleAsync(
            FavoriTakim entity,
            IEnumerable<string> ligler);

        Task GuncelleLigleriyleAsync(
            FavoriTakim entity,
            IEnumerable<string> ligler);
    }
}
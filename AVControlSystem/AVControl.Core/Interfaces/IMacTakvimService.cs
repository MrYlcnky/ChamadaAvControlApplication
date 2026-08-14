using AVControl.Core.Dtos.MacTakvimDtos;
using AVControl.Core.Entities;
using AVControl.Core.Interfaces;

namespace AVControl.Core.Interfaces
{
    public interface IMacTakvimService : IService<MacTakvim>
    {
        // Burada ileride "VerileriSenkronizeEtAsync" veya "FavorilereGoreGetir" gibi 
        // özel metotlarımızı tanımlayacağız.
        Task VerileriSenkronizeEtAsync(string tarih);
        
        Task<IEnumerable<MacTakvim>> GununFavoriMaclariniGetirAsync(DateTime tarih);
        Task<IEnumerable<MacTakvimRawDto>> GetirCanliVeriDirectAsync(string? tarih = null);
    }
}
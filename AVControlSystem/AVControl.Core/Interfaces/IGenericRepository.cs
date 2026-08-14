using System.Linq.Expressions;

namespace AVControl.Core.Interfaces
{
    public interface IGenericRepository<T> where T : class
    {
        Task<T?> IdyeGoreGetirAsync(int id);
        Task<IEnumerable<T>> TumunuGetirAsync();
        Task<IEnumerable<T>> TumunuGetirIlişkiliAsync(params Expression<Func<T, object>>[] includes);
        Task<IEnumerable<T>> KosulaGoreGetirAsync(Expression<Func<T, bool>> kosul);
        Task EkleAsync(T entity);
        void Guncelle(T entity);
        void Sil(T entity);
        IQueryable<T> GetAll();
    }
}
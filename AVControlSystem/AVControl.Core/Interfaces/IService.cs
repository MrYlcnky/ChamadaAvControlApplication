using System.Linq.Expressions;

namespace AVControl.Core.Interfaces
{
    public interface IService<T> where T : class
    {
        Task<T?> IdyeGoreGetirAsync(int id);
        Task<IEnumerable<T>> TumunuGetirAsync();
        Task<IEnumerable<T>> KosulaGoreGetirAsync(Expression<Func<T, bool>> kosul);
        Task<IEnumerable<T>> TumunuGetirIlişkiliAsync(params Expression<Func<T, object>>[] includes);
        Task<T> EkleAsync(T entity);
        Task GuncelleAsync(T entity);
        Task SilAsync(T entity);
    }
}
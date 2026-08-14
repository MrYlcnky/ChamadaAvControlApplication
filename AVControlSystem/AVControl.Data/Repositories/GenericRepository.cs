using AVControl.Core.Interfaces;
using AVControl.Data.Context;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace AVControl.Data.Repositories
{
    public class GenericRepository<T> : IGenericRepository<T> where T : class
    {
        protected readonly AppDbContext _context;
        private readonly DbSet<T> _dbSet;

        // Dependency Injection ile DbContext'i alıyoruz
        public GenericRepository(AppDbContext context)
        {
            _context = context;
            _dbSet = _context.Set<T>();
        }

        public async Task EkleAsync(T entity)
        {
            await _dbSet.AddAsync(entity);
        }

        public void Guncelle(T entity)
        {
            _dbSet.Update(entity);
        }

        public void Sil(T entity)
        {
            _dbSet.Remove(entity);
        }

        public async Task<T?> IdyeGoreGetirAsync(int id)
        {
            // FindAsync Primary Key (Id) üzerinden çok hızlı arama yapar
            return await _dbSet.FindAsync(id);
        }

        public async Task<IEnumerable<T>> TumunuGetirAsync()
        {
            // AsNoTracking() performansı artırır çünkü sadece okuma yapıyoruz, takip etmesine gerek yok
            return await _dbSet.AsNoTracking().ToListAsync();
        }

        public async Task<IEnumerable<T>> KosulaGoreGetirAsync(Expression<Func<T, bool>> kosul)
        {
            return await _dbSet.Where(kosul).ToListAsync();
        }

        // Gerekli namespace'e Microsoft.EntityFrameworkCore eklediğinizden emin olun.
        public async Task<IEnumerable<T>> TumunuGetirIlişkiliAsync(params Expression<Func<T, object>>[] includes)
        {
            IQueryable<T> query = _dbSet.AsNoTracking();

            // Dışarıdan gelen her bir Include ifadesini sorguya SQL JOIN olarak ekliyoruz
            foreach (var include in includes)
            {
                query = query.Include(include);
            }

            return await query.ToListAsync();
        }

        public IQueryable<T> GetAll()
        {
            return _context.Set<T>().AsQueryable(); // Tabloyu IQueryable olarak dışarı açar
        }
    }
}
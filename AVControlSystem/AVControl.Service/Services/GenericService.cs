using AVControl.Core.Interfaces;
using System.Linq.Expressions;

namespace AVControl.Service.Services
{
    public class GenericService<T> : IService<T> where T : class
    {
        protected readonly IGenericRepository<T> _repository;
        protected readonly IUnitOfWork _unitOfWork;

        // Constructor (Yapıcı Metot) ile Repository ve UnitOfWork'ü içeri alıyoruz (Dependency Injection)
        public GenericService(IGenericRepository<T> repository, IUnitOfWork unitOfWork)
        {
            _repository = repository;
            _unitOfWork = unitOfWork;
        }

        public virtual async Task<T> EkleAsync(T entity)
        {
            await _repository.EkleAsync(entity);
            await _unitOfWork.KaydetAsync(); // İşlemi onaylayıp veritabanına yazdırıyoruz
            return entity;
        }

        public virtual async Task GuncelleAsync(T entity)
        {
            _repository.Guncelle(entity);
            await _unitOfWork.KaydetAsync();
        }

        public async Task SilAsync(T entity)
        {
            _repository.Sil(entity);
            await _unitOfWork.KaydetAsync();
        }

        public async Task<T?> IdyeGoreGetirAsync(int id)
        {
            return await _repository.IdyeGoreGetirAsync(id);
        }

        public virtual async Task<IEnumerable<T>> TumunuGetirAsync()
        {
            return await _repository.TumunuGetirAsync();
        }

        public async Task<IEnumerable<T>> KosulaGoreGetirAsync(Expression<Func<T, bool>> kosul)
        {
            return await _repository.KosulaGoreGetirAsync(kosul);
        }

        public async Task<IEnumerable<T>> TumunuGetirIlişkiliAsync(params Expression<Func<T, object>>[] includes)
        {
            return await _repository.TumunuGetirIlişkiliAsync(includes);
        }
    }
}
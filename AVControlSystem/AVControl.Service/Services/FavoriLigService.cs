using AVControl.Core.Entities;
using AVControl.Core.Interfaces;
using AutoMapper;

namespace AVControl.Service.Services
{
    public class FavoriLigService : GenericService<FavoriLig>, IFavoriLigService
    {
        private readonly IMapper _mapper;

        public FavoriLigService(IGenericRepository<FavoriLig> repository, IUnitOfWork unitOfWork, IMapper mapper)
            : base(repository, unitOfWork)
        {
            _mapper = mapper;
        }
    }
}
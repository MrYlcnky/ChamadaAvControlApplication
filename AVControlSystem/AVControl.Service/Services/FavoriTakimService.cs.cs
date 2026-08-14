using AVControl.Core.Entities;
using AVControl.Core.Interfaces;
using AutoMapper;

namespace AVControl.Service.Services
{
    public class FavoriTakimService : GenericService<FavoriTakim>, IFavoriTakimService
    {
        private readonly IMapper _mapper;

        public FavoriTakimService(IGenericRepository<FavoriTakim> repository, IUnitOfWork unitOfWork, IMapper mapper)
            : base(repository, unitOfWork)
        {
            _mapper = mapper;
        }
    }
}
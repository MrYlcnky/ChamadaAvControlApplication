using AVControl.Core.Interfaces;
using AVControl.Data.Context;

namespace AVControl.Data.UnitOfWorks
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly AppDbContext _context;

        public UnitOfWork(AppDbContext context)
        {
            _context = context;
        }

        public void Kaydet()
        {
            _context.SaveChanges();
        }

        public async Task KaydetAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
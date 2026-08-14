namespace AVControl.Core.Interfaces
{
    public interface IUnitOfWork
    {
        Task KaydetAsync();
        void Kaydet();
    }
}
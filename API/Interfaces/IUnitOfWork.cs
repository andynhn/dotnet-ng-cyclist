using System.Threading.Tasks;

namespace API.Interfaces
{
    public interface IUnitOfWork
    {
        IUserRepository UserRepository {get; }
        IPhotoRepository PhotoRepository {get; }
        IMessageRepository MessageRepository {get; }
        IAdminRepository AdminRepository {get; }
        Task<bool> Complete();
        bool HasChanges();
    }
}
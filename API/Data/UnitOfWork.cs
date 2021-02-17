using System.Threading.Tasks;
using API.Entities;
using API.Interfaces;
using AutoMapper;
using Microsoft.AspNetCore.Identity;

namespace API.Data
{
    /*
        Implement the Unit of Work pattern for saving changes to the db
        This class is responsible for maintaining objects that make changes through entity framework, like repositories.
        The unit of work accesses those repositories and becomes the central location for tracking EF changes and saving to the database
        in 1 overall transaction.
    */
    /// <summary>
    /// Implement the Unit of Work pattern for saving changes to the db
    /// This class is responsible for maintaining objects that make changes through entity framework, like repositories.
    /// The unit of work accesses those repositories and becomes the central location for tracking EF changes and saving to the database
    /// in 1 overall transaction.
    /// </summary>
    public class UnitOfWork : IUnitOfWork
    {
        private readonly IMapper _mapper;
        private readonly DataContext _context;
        private readonly UserManager<AppUser> _userManager;
        public UnitOfWork(DataContext context, IMapper mapper, UserManager<AppUser> userManager)
        {
            _userManager = userManager;
            _context = context;
            _mapper = mapper;
        }

        // Below are the primary repositories in the app. Unit of work will access them and be the primary method of communication.
        public IUserRepository UserRepository => new UserRepository(_context, _mapper);

        public IMessageRepository MessageRepository => new MessageRepository(_context, _mapper);

        public IPhotoRepository PhotoRepository => new PhotoRepository(_context);

        public IAdminRepository AdminRepository => new AdminRepository(_context, _mapper, _userManager);


        /// <summary>
        /// Primary method to save changes to the database via Entity Framework.
        /// </summary>
        public async Task<bool> Complete()
        {
            // return true if number of state entries written to the database is greater than 0.
            return await _context.SaveChangesAsync() > 0;
        }

        /// <summary>
        /// Primary method to track any unsaved changes via Entity Framework.
        /// </summary>
        public bool HasChanges()
        {
            return _context.ChangeTracker.HasChanges();
        }
    }
}
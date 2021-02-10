using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using API.DTOs;
using API.Entities;
using API.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;

namespace API.Data
{
    /*
        Primary repository for Users
    */
    /// <summary>
    /// Primary repository for Userse
    /// </summary>
    public class UserRepository : IUserRepository
    {
        private readonly DataContext _context;
        private readonly IMapper _mapper;
        public UserRepository(DataContext context, IMapper mapper)
        {
            _mapper = mapper;
            _context = context;
        }

        /// <summary>
        /// Gets an app user based on the given id.
        /// </summary>
        /// <returns>
        /// 1 app user object
        /// </returns>
        public async Task<AppUser> GetUserByIdAsync(int id)
        {
            return await _context.Users.FindAsync(id);
        }

        /// <summary>
        /// Gets an app user based on the given username
        /// </summary>
        /// <returns>
        /// 1 app user object
        /// </returns>
        public async Task<AppUser> GetUserByUsernameAsync(string username)
        {
            return await _context.Users
                .Include(p => p.Photos)
                .SingleOrDefaultAsync(x => x.UserName == username);
        }

        /// <summary>
        /// Gets a list of users.
        /// </summary>
        /// <returns>
        /// List of app users.
        /// </returns>
        public async Task<IEnumerable<AppUser>> GetUsersAsync()
        {
            // must .Include to have photos returned from data context as well.
            return await _context.Users
                .Include(p => p.Photos)
                .ToListAsync();
        }

        /// <summary>
        /// Updates an app user. Signals to Entity Framework that the entity was modified.
        /// </summary>
        /// <returns>
        /// Void
        /// </returns>
        public void Update(AppUser user)
        {
            _context.Entry(user).State = EntityState.Modified;
        }

        /// <summary>
        /// Gets a user based on the given photoId
        /// </summary>
        /// <returns>
        /// 1 app user object
        /// </returns>
        public async Task<AppUser> GetUserByPhotoId(int photoId)
        {
            // from the context, include photos, ignore query fitlers and find a user,
            // first or default where any photo id matches the given photo id
            return await _context.Users
                .Include(p => p.Photos)
                .IgnoreQueryFilters()
                .Where(p => p.Photos.Any(p => p.Id == photoId))
                .FirstOrDefaultAsync();
        }

        /// <summary>
        /// Gets a user, as a member dto, which we use to show user profiles
        /// </summary>
        /// <returns>
        /// 1 app user mapped as a member dto
        /// </returns>
        public async Task<MemberDto> GetMemberAsync(string username, bool? isCurrentUser)
        {
            // get a user from the data context, based on the username, and map it
            // to a member dto. Make it queryable and set to ignore query filters
            // if it's the current logged in user.
            var query = _context.Users
                .Where(x => x.UserName == username)
                .ProjectTo<MemberDto>(_mapper.ConfigurationProvider)
                .AsQueryable();
            
            // ignore the photo query filter for the current user. 
            if (isCurrentUser == true) query = query.IgnoreQueryFilters();

            // we don't need the .Include when project to automapper above. Can be more efficient.
            return await query.FirstOrDefaultAsync();
        }

        /// <summary>
        /// Gets a list of members to dispay on the page
        /// </summary>
        /// <returns>
        /// 1List of app users as member dtos.
        /// </returns>
        public async Task<IEnumerable<MemberDto>> GetMembersAsync()
        {
            return await _context.Users
                .ProjectTo<MemberDto>(_mapper.ConfigurationProvider)
                .ToListAsync();
        }
    }
}
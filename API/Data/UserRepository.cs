using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using API.DTOs;
using API.Entities;
using API.Helpers;
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
    /// Primary repository for Users
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


        public async Task<string> GetUserGender(string username)
        {
            return await _context.Users
                .Where(x => x.UserName == username)
                .Select(x => x.Gender).FirstOrDefaultAsync();
        }


        /// <summary>
        /// Gets a list of users.
        /// </summary>
        /// <returns>
        /// List of app users.
        /// </returns>
        public async Task<IEnumerable<AppUser>> GetUsersAsync()
        {
            // must ".Include" to have photos returned from data context as well.
            return await _context.Users
                .Include(p => p.Photos)
                .ToListAsync();
        }

        /// <summary>
        /// Updates an app user. Signal to Entity Framework that the entity was modified.
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
            // from the context, include photos, ignore query filters, and find a user,
            // first or default where any photo id matches the given photo id
            return await _context.Users
                .Include(p => p.Photos)
                .IgnoreQueryFilters()
                .Where(p => p.Photos.Any(p => p.Id == photoId))
                .FirstOrDefaultAsync();
        }

        /// <summary>
        /// Gets a user, projected to a member dto, which we use to show user profiles
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
            
            // ignore the photo query filter for the current user so that they can still see unapproved photos.
            if (isCurrentUser == true) query = query.IgnoreQueryFilters();

            // we don't need the ".Include()" when we project to automapper above. Can be more efficient sometimes.
            return await query.FirstOrDefaultAsync();
        }

        /// <summary>
        /// Main method to get a list of members to dispay on the page. Return it as a PagedList so that we can enable pagination.
        /// AsNoTracking() turns off tracking in Entity Framework because we just want to read from it.
        /// Pass in userParams (in the query string) for queryable filtered results.
        /// </summary>
        /// <returns>
        /// 1 List of app users as member dtos.
        /// </returns>
        public async Task<PagedList<MemberDto>> GetMembersAsync(UserParams userParams)
        {
            // queryable so that we can decide what we want to filter by with a query.
            var query = _context.Users.AsQueryable();

            // with the given userParams, filter out the logged in user from the list.
            query = query.Where(u => u.UserName != userParams.CurrentUsername);
            
            // filter by these categories only if the user provided a filter (not null or empty)
            if (!string.IsNullOrEmpty(userParams.Gender)) 
                query = query.Where(u => u.Gender == userParams.Gender);
            if (!string.IsNullOrEmpty(userParams.CyclingFrequency)) 
                query = query.Where(u => u.CyclingFrequency == userParams.CyclingFrequency);
            if (!string.IsNullOrEmpty(userParams.CyclingCategory)) 
                query = query.Where(u => u.CyclingCategory == userParams.CyclingCategory);
            if (!string.IsNullOrEmpty(userParams.SkillLevel))
                query = query.Where(u => u.SkillLevel == userParams.SkillLevel);
            if (!string.IsNullOrEmpty(userParams.NameSearch))
                query = query.Where(u => (u.FirstName + u.LastName).Contains(userParams.NameSearch.ToLower()));
            if (!string.IsNullOrEmpty(userParams.State))
                query = query.Where(u => u.State == userParams.State);
            if (!string.IsNullOrEmpty(userParams.City))
                query = query.Where(u => u.City == userParams.City);
            
            // If the user wants to filter users by age, calculate minimum age and maximum age filtering
            var minDob = DateTime.Today.AddYears(-userParams.MaxAge - 1);
            var maxDob = DateTime.Today.AddYears(-userParams.MinAge);
            query = query.Where(u => u.DateOfBirth >= minDob && u.DateOfBirth <= maxDob);

            // these are the new C# switch expressions. instead of creating switch and cases, we can do this.
            // the _ is the default case.
            query = userParams.OrderBy switch
            {
                "createdAt" => query.OrderByDescending(u => u.CreatedAt),
                "aToZ" => query.OrderBy(u => u.FirstName),
                "zToA" => query.OrderByDescending(u => u.FirstName),
                "cityA" => query.OrderBy(u => u.City),
                "cityD" => query.OrderByDescending(u => u.City),
                "stateA" => query.OrderBy(u => u.State),
                "stateD" => query.OrderByDescending(u => u.State),
                _ => query.OrderByDescending(u => u.LastActive)
            };

            // project to automapper here before sending back
            return await PagedList<MemberDto>.CreateAsync(query.ProjectTo<MemberDto>(_mapper.ConfigurationProvider).AsNoTracking(), 
                userParams.PageNumber, userParams.PageSize);
        }
        /// <summary>
        /// Main method to get a list of members that a user has a message gruop with.
        /// For a facebook-messenger style page that shows users on left and chat box on right.
        /// From the array of usernames, return the users as MemberDtos with those usernames.
        /// </summary>
        public async Task<IEnumerable<MemberDto>> GetMembersForChatAsync(IEnumerable<string> usernames)
        {
            return await _context.Users
                .Include(p => p.Photos)
                .ProjectTo<MemberDto>(_mapper.ConfigurationProvider)
                .Where(u => usernames.Contains(u.Username))
                .OrderByDescending(u => u.LastActive)
                .ToListAsync();
        }

    }
}
using System.Linq;
using System.Threading.Tasks;
using API.DTOs;
using API.Entities;
using API.Helpers;
using API.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace API.Data
{
    public class AdminRepository : IAdminRepository
    {
        private readonly DataContext _context;
        private readonly IMapper _mapper;
        private readonly UserManager<AppUser> _userManager;
        public AdminRepository(DataContext context, IMapper mapper, UserManager<AppUser> userManager)
        {
            _userManager = userManager;
            _mapper = mapper;
            _context = context;
        }

        /// <summary>
        /// Primary repo method for getting users with roles for admins
        /// </summary>
        public async Task<PagedList<UserWithRolesDto>> GetUsersWithRoles(UserManageParams userManageParams)
        {
            var query = _userManager.Users
                .Include(r => r.UserRoles)
                .ThenInclude(r => r.Role)
                .OrderBy(u => u.UserName)
                .Select(u => new UserWithRolesDto
                    {
                        Id = u.Id,
                        CreatedAt = u.CreatedAt,
                        Username = u.UserName,
                        Roles = u.UserRoles.Select(r => r.Role.Name).ToList()
                    })
                .AsQueryable();
            
            if (!string.IsNullOrEmpty(userManageParams.UsernameSearch))
                query = query.Where(u => u.Username.Contains(userManageParams.UsernameSearch.ToLower()));
            if (!string.IsNullOrEmpty(userManageParams.Roles))
            {
                // comes in as string, so split into an Array
                var rolesArray = userManageParams.Roles.Split(',');
                // for loop to query roles for each role provided.
                foreach (var role in rolesArray)
                {
                    // each pass through loop will filter the user results
                    // e.g. if rolesArray has 'Admin' and 'Member', first pass will get a query of all users with 'Admin'. Then of that result, it will get those with the role of 'Member'. So at the end, only users in the query are users with Admin AND Member.
                    query = query.Where(u => u.Roles.Contains(role));
                }
            }
            // these are the new C# switch expressions. instead of creating switch and cases, we can do this.
            // the _ is the default case.
            query = userManageParams.OrderBy switch
            {
                "createdAt" => query.OrderByDescending(u => u.CreatedAt),
                "zToA" => query.OrderByDescending(u => u.Username),
                _ => query.OrderBy(u => u.Username)
            };

            // consider .AsNoTracking() on the query later if not needed.
            return await PagedList<UserWithRolesDto>.CreateAsync(query, userManageParams.PageNumber, userManageParams.PageSize);

        }
    }
}
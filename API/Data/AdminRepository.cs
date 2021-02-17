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

        public async Task<PagedList<UserWithRolesDto>> GetUsersWithRoles(UserManageParams userManageParams)
        {
            var query = _userManager.Users
                .Include(r => r.UserRoles)
                .ThenInclude(r => r.Role)
                .OrderBy(u => u.UserName)
                .Select(u => new UserWithRolesDto
                    {
                        Id = u.Id,
                        Username = u.UserName,
                        Roles = u.UserRoles.Select(r => r.Role.Name).ToList()
                    })
                .AsQueryable();

            // consider .AsNoTracking() on the query later if not needed.
            return await PagedList<UserWithRolesDto>.CreateAsync(query, userManageParams.PageNumber, userManageParams.PageSize);

        }
    }
}
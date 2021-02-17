using System.Threading.Tasks;
using API.DTOs;
using API.Helpers;

namespace API.Interfaces
{
    public interface IAdminRepository
    {
        Task<PagedList<UserWithRolesDto>> GetUsersWithRoles(UserManageParams userManageParams);
    }
}
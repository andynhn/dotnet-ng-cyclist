using System.Collections.Generic;
using System.Threading.Tasks;
using API.DTOs;
using API.Entities;
using API.Helpers;

namespace API.Interfaces
{
    public interface IUserRepository
    {
        Task<AppUser> GetUserByIdAsync(int id);
        Task<AppUser> GetUserByUsernameAsync(string username);
        Task<AppUser> GetUserByPhotoId(int photoId);
        Task<IEnumerable<AppUser>> GetUsersAsync();
        Task<string> GetUserGender(string username);
        void Update(AppUser user);

        // need to ignore the query filter for photos for the current user...
        Task<MemberDto> GetMemberAsync(string username, bool? isCurrentUser);
        Task<PagedList<MemberDto>> GetMembersAsync(UserParams userParams);
    }
}
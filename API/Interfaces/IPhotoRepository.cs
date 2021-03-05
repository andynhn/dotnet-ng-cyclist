using System.Collections.Generic;
using System.Threading.Tasks;
using API.DTOs;
using API.Entities;
using API.Helpers;

namespace API.Interfaces
{
    public interface IPhotoRepository
    {
        Task<PagedList<PhotoForApprovalDto>> GetUnapprovedPhotos(PhotoManageParams photoManageParams);
        Task<Photo> GetPhotoById(int id);
        void RemovePhoto(Photo photo);
        Task<IEnumerable<Photo>> GetUsersPhotos(string username);
    }
}
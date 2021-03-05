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
        Primary repository for Photos
    */
    /// <summary>
    /// Primary repository for Photos
    /// </summary>
    public class PhotoRepository : IPhotoRepository
    {
        private readonly DataContext _context;
        public PhotoRepository(DataContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Primary repo method for getting a photo by id
        /// </summary>
        public async Task<Photo> GetPhotoById(int id)
        {
            return await _context.Photos
                .IgnoreQueryFilters()
                .SingleOrDefaultAsync(x => x.Id == id);
        }

        /// <summary>
        /// Primary repo method forgetting a paged list of unapproved photos
        /// </summary>
        public async Task<PagedList<PhotoForApprovalDto>> GetUnapprovedPhotos(PhotoManageParams photoManageParams)
        {
            var query = _context.Photos
                .IgnoreQueryFilters()
                .Where(p => p.IsApproved == false)
                .Select(u => new PhotoForApprovalDto
                {
                    Id = u.Id,
                    Username = u.AppUser.UserName,
                    Url = u.Url,
                    IsApproved = u.IsApproved,
                    State = u.AppUser.State,
                    City = u.AppUser.City,
                    LastActive = u.AppUser.LastActive
                })
                .AsQueryable();
            
            if (!string.IsNullOrEmpty(photoManageParams.UsernameSearch))
                query = query.Where(u => u.Username.Contains(photoManageParams.UsernameSearch.ToLower()));
            if (!string.IsNullOrEmpty(photoManageParams.State))
                query = query.Where(u => u.State == photoManageParams.State);
            if (!string.IsNullOrEmpty(photoManageParams.City))
                query = query.Where(u => u.City == photoManageParams.City);

            query = photoManageParams.OrderBy switch
            {
                "aToZ" => query.OrderBy(u => u.Username),
                "zToA" => query.OrderByDescending(u => u.Username),
                _ => query.OrderByDescending(u => u.LastActive)
            };
            
            return await PagedList<PhotoForApprovalDto>.CreateAsync(query, photoManageParams.PageNumber, photoManageParams.PageSize);
        }

        public async Task<IEnumerable<Photo>> GetUsersPhotos(string username)
        {
            return await _context.Photos
                .Where(p => p.AppUser.UserName == username)
                .ToListAsync();            
        }

        /// <summary>
        /// Primary repo method for removing a photo from the data context
        /// </summary>
        public void RemovePhoto(Photo photo)
        {
            _context.Photos.Remove(photo);
        }
    }
}
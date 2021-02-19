using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Helpers;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers
{
    /*
        The primary controller for Admin functionality
    */
    /// <summary>
    /// The primary controller for Admin functionality
    /// </summary>
    public class AdminController : BaseApiController
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPhotoService _photoService;
        public AdminController(UserManager<AppUser> userManager, IUnitOfWork unitOfWork, IPhotoService photoService)
        {
            _photoService = photoService;
            _unitOfWork = unitOfWork;
            _userManager = userManager;
        }

        [Authorize(Policy = "RequireAdminRole")]
        [HttpGet("users-with-roles")]
        public async Task<ActionResult<IEnumerable<UserWithRolesDto>>> GetUsersWithRoles([FromQuery] UserManageParams userManageParams)
        {
            if (!string.IsNullOrEmpty(userManageParams.UsernameSearch))
            {
                // transform the results from username search.
                userManageParams.UsernameSearch = userManageParams.UsernameSearch.Trim().ToLower();
                if (userManageParams.UsernameSearch.Length > 30)
                {
                    // set max length of Username search to 30. only return 30 characters if greater than max length.
                    userManageParams.UsernameSearch = userManageParams.UsernameSearch.Substring(0, 30);
                }
            }
            var usersWithRoles = await _unitOfWork.AdminRepository.GetUsersWithRoles(userManageParams);

            Response.AddPaginationHeader(usersWithRoles.CurrentPage, usersWithRoles.PageSize, usersWithRoles.TotalCount, usersWithRoles.TotalPages);

            return Ok(usersWithRoles);
        }

        [Authorize(Policy = "RequireAdminRole")]
        [HttpPost("edit-roles/{username}")]
        public async Task<ActionResult> EditRoles(string username, [FromQuery] string roles)
        {
            // roles coming in as comma separated list in query string, so split by "," and then convert to array.
            var selectedRoles = roles.Split(",").ToArray();

            // get the user to edit.
            var user = await _userManager.FindByNameAsync(username);

            if (user == null) return NotFound("Could not find user");

            // get that user's roles.
            var userRoles = await _userManager.GetRolesAsync(user);

            // add the user to the roles. From the roles in the query string, we filter out the roles that they already are assigned to.
            var result = await _userManager.AddToRolesAsync(user, selectedRoles.Except(userRoles));

            if (!result.Succeeded) return BadRequest("Failed to add to roles");

            // remove the user from all roles except the selected roles that we added to them a step above.
            result = await _userManager.RemoveFromRolesAsync(user, userRoles.Except(selectedRoles));

            if (!result.Succeeded) return BadRequest("Failed to remove from roles");

            // return the new list of roles for that user.
            return Ok(await _userManager.GetRolesAsync(user));
        }

        [Authorize(Policy = "ModeratePhotoRole")]
        [HttpGet("photos-to-moderate")]
        public async Task<ActionResult<IEnumerable<PhotoForApprovalDto>>> GetPhotosForModeration([FromQuery] PhotoManageParams photoManageParams)
        {
            if (!string.IsNullOrEmpty(photoManageParams.UsernameSearch))
            {
                photoManageParams.UsernameSearch = photoManageParams.UsernameSearch.Trim().ToLower();
                if (photoManageParams.UsernameSearch.Length > 30)
                {
                    photoManageParams.UsernameSearch = photoManageParams.UsernameSearch.Substring(0, 30);
                }
            } 

            var photosForModeration = await _unitOfWork.PhotoRepository.GetUnapprovedPhotos(photoManageParams);

            Response.AddPaginationHeader(photosForModeration.CurrentPage, photosForModeration.PageSize, photosForModeration.TotalCount, photosForModeration.TotalPages);

            return Ok(photosForModeration);
        }

        [Authorize(Policy = "ModeratePhotoRole")]
        [HttpPost("approve-photo/{photoId}")]
        public async Task<ActionResult> ApprovePhoto(int photoId)
        {
            var photo = await _unitOfWork.PhotoRepository.GetPhotoById(photoId);

            if (photo == null) return NotFound("Could not find photo");

            // note: always make sure that you are updating the Photo object and not the DTO.
            // set isApproved to true.
            photo.IsApproved = true;

            // now, after approval, check to see if the user has a IsMain photo. Get the user from the photo id.
            var user = await _unitOfWork.UserRepository.GetUserByPhotoId(photoId);

            // after a moderator approves the photo, check if the user has any photos set to IsMain. If not, set the new photo to the main photo.
            if (!user.Photos.Any(x => x.IsMain)) photo.IsMain = true;

            // save changes to the db after updating the photo.
            if (await _unitOfWork.Complete()) return Ok();

            return BadRequest("Problem approving photo");
        }

        [Authorize(Policy = "ModeratePhotoRole")]
        [HttpPost("reject-photo/{photoId}")]
        public async Task<ActionResult> RejectPhoto(int photoId)
        {
            // get the photo
            var photo = await _unitOfWork.PhotoRepository.GetPhotoById(photoId);

            // return notfound if the photo is null.
            if (photo == null) return NotFound();

            // If the photo is on cloudinary (has a PublicId for cloudinary)
            if (photo.PublicId != null)
            {
                // Delete the photo from cloudinary
                var result = await _photoService.DeletePhotoAsync(photo.PublicId);

                // wait until the result comes back OK from the DeletePhotoAsync. Then, delete the photo from the photo repo
                if (result.Result == "ok")
                {
                    _unitOfWork.PhotoRepository.RemovePhoto(photo);
                }
            }
            else
            {
                // if the photo is not on cloudinary, skip to just deleting it from the repo.
                _unitOfWork.PhotoRepository.RemovePhoto(photo);
            }

            // save changes to the db after removing the photo.
            if (await _unitOfWork.Complete()) return Ok();

            return BadRequest("Failed to reject and remove the photo");
        }
    }
}
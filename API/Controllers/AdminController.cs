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

        /// <summary>
        /// Primary route that get's users (with roles) for the admin. Only admin roles can access this route. Includes search parameters
        /// </summary>
        [Authorize(Policy = "RequireAdminRole")]
        [HttpGet("users-with-roles")]
        public async Task<ActionResult<IEnumerable<UserWithRolesDto>>> GetUsersWithRoles([FromQuery] UserManageParams userManageParams)
        {
            if (!string.IsNullOrEmpty(userManageParams.UsernameSearch))
            {
                // transform the results from username search. Trim any results longer than 30 characters.
                userManageParams.UsernameSearch = userManageParams.UsernameSearch.Trim().ToLower();
                if (userManageParams.UsernameSearch.Length > 30)
                {
                    // set max length of Username search to 30. only return 30 characters if greater than max length.
                    userManageParams.UsernameSearch = userManageParams.UsernameSearch.Substring(0, 30);
                }
            }
            // get the users from the search parameters
            var usersWithRoles = await _unitOfWork.AdminRepository.GetUsersWithRoles(userManageParams);

            // add a pagination header to the response so that our pagination works.
            Response.AddPaginationHeader(usersWithRoles.CurrentPage, usersWithRoles.PageSize, usersWithRoles.TotalCount, usersWithRoles.TotalPages);

            // return ok with the paged list of users.
            return Ok(usersWithRoles);
        }

        /// <summary>
        /// Primary route for admin's to update a user's role. Only admin roles can access this route.
        /// </summary>
        [Authorize(Policy = "RequireAdminRole")]
        [HttpPost("edit-roles/{username}")]
        public async Task<ActionResult> EditRoles(string username, [FromQuery] string roles)
        {
            // roles coming in as comma separated list in the query string, so split by "," and then convert to array.
            var selectedRoles = roles.Split(",").ToArray();

            // get the user to edit from the given username.
            var user = await _userManager.FindByNameAsync(username);

            // return not found if the user does not exist.
            if (user == null) return NotFound("Could not find user");

            // get that user's roles.
            var userRoles = await _userManager.GetRolesAsync(user);

            // add the user to the roles. From the roles in the query string, we filter out the roles that they already are assigned to.
            var result = await _userManager.AddToRolesAsync(user, selectedRoles.Except(userRoles));

            // if it didn't succeed, return bad request
            if (!result.Succeeded) return BadRequest("Failed to add to roles");

            // Then remove the user from all roles except the selected roles that we added to them a step above.
            result = await _userManager.RemoveFromRolesAsync(user, userRoles.Except(selectedRoles));

            // if it didn't succeed, return bad request
            if (!result.Succeeded) return BadRequest("Failed to remove from roles");

            // return ok with the the new list of roles for that user.
            return Ok(await _userManager.GetRolesAsync(user));
        }


        /// <summary>
        /// Primary route for admin's to delete a user. Only admin roles can access this route.
        /// </summary>
        [Authorize(Policy = "RequireAdminRole")]
        [HttpDelete("delete-user/{username}")]
        public async Task<ActionResult> DeleteUser(string username)
        {
            // get the user to delete from the given username.
            var user = await _userManager.FindByNameAsync(username);
            // return not found if the user does not exist.
            if (user == null) return NotFound("Could not find user");

            // 1. Delete all their photos
            var photos = await _unitOfWork.PhotoRepository.GetUsersPhotos(username);
            if (photos.Count() > 0)
            {
                foreach (var photo in photos)
                {
                    // remove from cloudinary
                    if (photo.PublicId != null) 
                    {
                        var r = await _photoService.DeletePhotoAsync(photo.PublicId);
                        if (r.Error != null) return BadRequest(r.Error.Message);
                    }
                    // tell EF to track for removal from db
                    user.Photos.Remove(photo);
                }
            }

            // 2. Delete all messages that are connected to them
            var allMessages = await _unitOfWork.MessageRepository.GetAllUsersMessages(username);
            if (allMessages.Count() > 0)
            {
                // no need to check if sender deleted or recipient deleted here. Just delete it no matter what.
                _unitOfWork.MessageRepository.DeleteMessages(allMessages);
            }

            // 3. Delete their message groups and any remaining connections on that group (should remove automatically when they leave a hub)
            // but in case there are any existing hubs with this username and connection.
            var groups = await _unitOfWork.MessageRepository.GetMessageGroupsByUsername(username);
            if (groups.Count() > 0)
            {
                // Delete connections associated with the group (revisit this)
                foreach (var group in groups) 
                {
                    var connection = group.Connections.FirstOrDefault();
                    if (connection != null) 
                    {
                        _unitOfWork.MessageRepository.RemoveConnection(connection);
                    }
                }
                // after deleting connections associated with the username, delete the message groups.
                _unitOfWork.MessageRepository.DeleteMessageGroups(groups);
            }
            

            // 4. Now, use ASPNET Identity. Delete their roles.
            var userRoles = await _userManager.GetRolesAsync(user);
            if (userRoles.Count() > 0)
            {
                // Then remove the user from all roles.
                var deleteRolesResult = await _userManager.RemoveFromRolesAsync(user, userRoles);
                if (!deleteRolesResult.Succeeded) return BadRequest("Failed to remove user roles");
            }

            // 5...and finally delete the user.
            var result = await _userManager.DeleteAsync(user);
            // ASPNET identity takes care of saving the db changes for us
            // if it didn't succeed, return bad request
            if (!result.Succeeded) return BadRequest("Failed to delete user");

            // check if _unitOfWork has changes (other than ASPNET Identity)
            if (_unitOfWork.HasChanges())
            {
                // save if the changes exist
                if (await _unitOfWork.Complete()) return Ok();
                // if issues with this, return bad request
                return BadRequest("Something went wrong when trying to save changes after deleting a user");
            }
            // if we make it here, no EF changes were made. Delete was successful.
            return Ok(); 
        }

        /// <summary>
        /// Primary route for admin's and moderators to get photos to moderate. Only admin and moderator roles can access this route.
        /// </summary>
        [Authorize(Policy = "ModeratePhotoRole")]
        [HttpGet("photos-to-moderate")]
        public async Task<ActionResult<IEnumerable<PhotoForApprovalDto>>> GetPhotosForModeration([FromQuery] PhotoManageParams photoManageParams)
        {
            if (!string.IsNullOrEmpty(photoManageParams.UsernameSearch))
            {
                // transform the results from username search. Trim any results longer than 30 characters.
                photoManageParams.UsernameSearch = photoManageParams.UsernameSearch.Trim().ToLower();
                if (photoManageParams.UsernameSearch.Length > 30)
                {
                    photoManageParams.UsernameSearch = photoManageParams.UsernameSearch.Substring(0, 30);
                }
            } 

            // get the photos for moderation
            var photosForModeration = await _unitOfWork.PhotoRepository.GetUnapprovedPhotos(photoManageParams);

            // add a response header so that our pagination works.
            Response.AddPaginationHeader(photosForModeration.CurrentPage, photosForModeration.PageSize, photosForModeration.TotalCount, photosForModeration.TotalPages);

            // return ok with the paged list of pohotos for moderation
            return Ok(photosForModeration);
        }

        /// <summary>
        /// Primary route for admin's and moderators to approve photos. Only admin and moderator roles can access this route.
        /// </summary>
        [Authorize(Policy = "ModeratePhotoRole")]
        [HttpPost("approve-photo/{photoId}")]
        public async Task<ActionResult> ApprovePhoto(int photoId)
        {
            var photo = await _unitOfWork.PhotoRepository.GetPhotoById(photoId);

            if (photo == null) return NotFound("Could not find photo");

            // note: make sure that you are updating the Photo object and not the DTO.
            // set isApproved to true.
            photo.IsApproved = true;

            // after approval, check to see if the user has a 'IsMain' photo. Get the user from the photo id.
            var user = await _unitOfWork.UserRepository.GetUserByPhotoId(photoId);

            // after a moderator approves the photo, check if the user has any photos set to 'IsMain'. If not, set the new photo to the main photo.
            if (!user.Photos.Any(x => x.IsMain)) photo.IsMain = true;

            // save changes to the db after updating the photo.
            if (await _unitOfWork.Complete()) return Ok();

            // if everything fails, return bad request
            return BadRequest("Problem approving photo");
        }

        /// <summary>
        /// Primary route for admin's and moderators to reject photos. Only admin and moderator roles can access this route.
        /// </summary>
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

            // if everything fails, return bad request.
            return BadRequest("Failed to reject and remove the photo");
        }
    }
}
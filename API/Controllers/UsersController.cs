using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using API.Data;
using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Helpers;
using API.Interfaces;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers
{
    /*
        The primary controller for C.R.U.D. actions (Create, Read, Update, Delete) involving App Users.
        [Authorize] tag ensures only authorized users access these routes.
        Inherits from BaseApiController which uses the route "api/[controller]"
    */
    /// <summary>
    /// The primary controller for C.R.U.D. actions (Create, Read, Update, Delete) involving App Users.
    /// [Authorize] tag ensures only authorized users access these routes.
    /// Inherits from BaseApiController which uses the route "api/[controller]"
    /// </summary>
    [Authorize]
    public class UsersController : BaseApiController
    {
        // need IMapper to help map DTOs to Entity objects.
        private readonly IMapper _mapper;
        private readonly IPhotoService _photoService;
        // the unit of work will save changes to the db
        private readonly IUnitOfWork _unitOfWork;
        public UsersController(IUnitOfWork unitOfWork, IMapper mapper,
            IPhotoService photoService)
        {
            _unitOfWork = unitOfWork;
            _photoService = photoService;
            _mapper = mapper;
        }

        /// <summary>
        /// Asynchronously get's users and returns them after they are mapped to MemberDtos
        /// Route: "api/users"
        /// </summary>
        /// <returns>
        /// List of users via the memberDto data object, as well as Status Code 200OK.
        /// </returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MemberDto>>> GetUsers([FromQuery] UserParams userParams)
        {
            /*
                User.GetUsername() gets the username from a User claims principle
                We want to get the username from what we're authenticating against which is the token.
                Inside a Controller we have access to a claims principle of the User. This contains info about their identity.
                We want to find the claim that matches the name identifier, which is the claim that we give the user in their token.
            */
            userParams.CurrentUsername = User.GetUsername();

            // make sure. can only do transformations if not null or empty.
            if (!string.IsNullOrEmpty(userParams.NameSearch)) 
            {
                userParams.NameSearch = userParams.NameSearch.Trim().ToLower();
                if (userParams.NameSearch.Length > 30)
                {
                    // set max length of name search to 30. only return 30 characters if greater than max length.
                    userParams.NameSearch = userParams.NameSearch.Substring(0, 30);
                }
            }

            // Get a PagedList of filtered users based on the userParams
            var users = await _unitOfWork.UserRepository.GetMembersAsync(userParams);

            // Pass the the pagination data back via a Pagination Header. We always have access to the Response in here.
            Response.AddPaginationHeader(users.CurrentPage, users.PageSize, users.TotalCount, users.TotalPages);

            // Needed the Ok() result here because of IEnumerable (TODO: revisit returning ok, sending a pagedlist)
            return Ok(users);
        }

        /// <summary>
        /// Given a <param name="username">, asynchronously gets user data as a member dto, and sets the 
        /// "isCurrentUser" flag to true if <param name="username"> matches the username
        /// from the Claims Principal. Allows for current user viewing their own profile to ignore query filters
        /// and access information specifically for them.
        /// Route: "api/users/<param name="username">"
        /// </summary>
        /// <returns>
        /// User information via the memberDto data object.
        /// </returns>
        /// <param name="username">A username.</param>
        [HttpGet("{username}", Name = "GetUser")]
        public async Task<ActionResult<MemberDto>> GetUser(string username)
        {
            // get the current user's username from the Claims Principal
            var currentUsername = User.GetUsername();
            // set current user to true if the user being fetched is the current logged in user.
            var member = await _unitOfWork.UserRepository.GetMemberAsync(username, isCurrentUser: currentUsername == username);
            return Ok(member);
        }

        /// <summary>
        /// Given a <param name="memberUpdateDto">, asynchronously updates user data,
        /// Route: "api/users"
        /// </summary>
        /// <returns>
        /// Status204NoContent, or if update fails, Status400BadRequest.
        /// </returns>
        /// <param name="memberUpdateDto">Member DTO data object for updating users.</param>
        [HttpPut]
        public async Task<ActionResult> UpdateUser(MemberUpdateDto memberUpdateDto)
        {
            // get the current user from the Claims Principal.
            var user = await _unitOfWork.UserRepository.GetUserByUsernameAsync(User.GetUsername());

            // use automapper to map the memberUpdateDto information to the user we returned from the UserRepository.
            _mapper.Map(memberUpdateDto, user);
            // Update these properties before saving to the DB.
            user.UpdatedAt = DateTime.UtcNow;
            user.FirstName = user.FirstName.ToLower();
            user.LastName = user.LastName.ToLower();
            user.CyclingFrequency = user.CyclingFrequency.ToLower();
            user.CyclingCategory = user.CyclingCategory.ToLower();
            user.SkillLevel = user.SkillLevel.ToLower();

            // Update the database with the new changes.
            _unitOfWork.UserRepository.Update(user);

            // save changes to the db then return 204NoContent.
            if (await _unitOfWork.Complete()) return NoContent();
            // return 400BadRequest if all fails.
            return BadRequest("Failed to update user");
        }

        /// <summary>
        /// HttpPost api request for adding a new photo to a user's profile.
        /// Given a <param name="file">, asynchronously adds a new photo to a user's profile,
        /// Route: "api/users/add-photo"
        /// </summary>
        /// <returns>
        /// If photo was uploaded successfully, Status201Created and the CreatedAtRouteResult for the response
        /// If result.Error, Status400BadRequest with error message.
        /// If everything failed, Status400BadRequest.
        /// </returns>
        /// <param name="file">Photo to upload for a user as an IFormFile.</param>
        [HttpPost("add-photo")]
        public async Task<ActionResult<PhotoDto>> AddPhoto(IFormFile file)
        {
            // get logged in user from the ClaimsPrincipal
            var user = await _unitOfWork.UserRepository.GetUserByUsernameAsync(User.GetUsername());

            // Add photo to cloudinary via the photo service. get results back from the photo service.
            var result = await _photoService.AddPhotoAsync(file);
            // If result.Error has data, return BadRequest beacuse there was an error uploading to Cloudinary
            if (result.Error != null) return BadRequest(result.Error.Message);

            // Create a new photo object with the data returned from Cloudinary.
            var photo = new Photo
            {
                Url = result.SecureUrl.AbsoluteUri,
                PublicId = result.PublicId
            };
            // add the new photo to the user's existing list of photos.
            user.Photos.Add(photo);

            // save changes to the db...then send route name, route values, and value in order to send back a 201 status.
            if (await _unitOfWork.Complete())
                return CreatedAtRoute("GetUser", new { username = user.UserName }, _mapper.Map<PhotoDto>(photo));

            // if we make it here, then something went wrong.
            return BadRequest("Problem adding photo");
        }

        /// <summary>
        /// HttpPut api request for updating a user's main photo.
        /// Given a <param name="photoId">, asynchronously sets the user's main photo to the given photo.
        /// Route: "api/users/set-main-photo/<param name="photoId">"
        /// </summary>
        /// <returns>
        /// If main photo was set successfully, return Status204NoContent.
        /// If photo was already the main photo, return Status400BadRequest.
        /// If everything failed, return Status400BadRequest.
        /// </returns>
        /// <param name="photoId">Photo id for the photo the user wants to set as their main photo.</param>
        [HttpPut("set-main-photo/{photoId}")]
        public async Task<ActionResult> SetMainPhoto(int photoId)
        {
            // get logged in user from the ClaimsPrincipal. Eager Loading here gives us the photos as well.
            var user = await _unitOfWork.UserRepository.GetUserByUsernameAsync(User.GetUsername());

            // get the photo from the given photo id.
            var photo = user.Photos.FirstOrDefault(x => x.Id == photoId);

            // if the photo is already the main photo, return BadRequest.
            if (photo.IsMain) return BadRequest("This is already your main photo");

            var currentMain = user.Photos.FirstOrDefault(x => x.IsMain);

            // set the current main photo's IsMain property to false.
            if (currentMain != null) currentMain.IsMain = false;

            // set the new main photo's IsMain property to true.
            photo.IsMain = true;

            // wait for the unit of work to save to the database, then return 204 no content.
            if (await _unitOfWork.Complete()) return NoContent();

            // otherwise return 400BadRequest.
            return BadRequest("Failed to set main photo");
        }

        /// <summary>
        /// HttpDelete api request for deleting a photo from a user's profile.
        /// Given a <param name="photoId">, asynchronously deletes photo associated with the id.
        /// Route: "api/users/delete-photo/<param name="photoId">"
        /// </summary>
        /// <returns>
        /// Status404NotFound if photo is null, 
        /// Status400BadRequest if photo is the main photo,
        /// Status401Unauthorized if user is not associated with the photo,
        /// Status400BadRequest if error when trying to delete from Cloudinary,
        /// Status200OK if photo was successfully deleted,
        /// Status400BadRequest if everything failed.
        /// </returns>
        /// <param name="photoId">PhotoId for the photo the user wants to delete.</param>
        [HttpDelete("delete-photo/{photoId}")]
        public async Task<ActionResult> DeletePhoto(int photoId)
        {
            // get logged in user from the ClaimsPrincipal.
            var user = await _unitOfWork.UserRepository.GetUserByUsernameAsync(User.GetUsername());

            // get the photo from the given photo id.
            var photo = await _unitOfWork.PhotoRepository.GetPhotoById(photoId);

            // return notfound if the photo is null.
            if (photo == null) return NotFound();

            // prevent user from deleting their main photo.
            if (photo.IsMain) return BadRequest("You cannot delete your main photo");

            // just in case...prevent unauthorized
            if (user.Id != photo.AppUserId) return Unauthorized("That action is unauthorized");

            // if the photo is in cloudinary (has a cloudinary PublicId), then proceed to delete it from cloudinary.
            if (photo.PublicId != null)
            {
                var result = await _photoService.DeletePhotoAsync(photo.PublicId);
                // return error message if the cloudinary result has errors.
                if (result.Error != null) return BadRequest(result.Error.Message);
            }

            // after deleting from cloudinary, remove the photo from the user's list of photos via entity framework.
            user.Photos.Remove(photo);

            // save changes to the db. Then return 200Ok
            if (await _unitOfWork.Complete()) return Ok();

            return BadRequest("Failed to delete the photo");
        }
    }
}
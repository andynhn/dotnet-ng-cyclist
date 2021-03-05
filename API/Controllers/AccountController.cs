using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using API.Data;
using API.DTOs;
using API.Entities;
using API.Interfaces;
using API.Extensions;
using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;

namespace API.Controllers
{
    /*
        The primary controller for registering and logging in App Users.
    */
    /// <summary>
    /// The primary controller for registering and logging in App Users.
    /// Contains 2 API routes pertaining to user accounts: Register and Login.
    /// </summary>
    public class AccountController : BaseApiController
    {
        private readonly ITokenService _tokenService;
        private readonly IMapper _mapper;
        private readonly UserManager<AppUser> _userManager;
        private readonly SignInManager<AppUser> _signInManager;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPhotoService _photoService;
        public AccountController(UserManager<AppUser> userManager, SignInManager<AppUser> signInManager, IPhotoService photoService, ITokenService tokenService, IMapper mapper, IUnitOfWork unitOfWork)
        {
            _photoService = photoService;
            _unitOfWork = unitOfWork;
            _signInManager = signInManager;
            _userManager = userManager;
            _mapper = mapper;
            _tokenService = tokenService;
        }

        /*
            HttpPost API for registering users.
        */
        /// <summary>
        /// HttpPost API for registering users.
        /// </summary>
        /// <returns>
        /// The UserDto, once the user is registered and validated (data transfer object containing useful user information, including their JWT)
        /// </returns>
        /// <param name="registerDto">Register data transfer object that contains the user's registration inforamtion</param>
        [HttpPost("register")]
        public async Task<ActionResult<UserDto>> Register(RegisterDto registerDto)
        {
            // front-end checks exist, but add these checks just in case.
            if (registerDto.Username == null || registerDto.Password == null || registerDto.FirstName == null
                || registerDto.LastName == null || registerDto.State == null || registerDto.City == null
                || registerDto.DateOfBirth.ToShortDateString() == null || registerDto.Gender == null
                || registerDto.CyclingCategory == null || registerDto.CyclingFrequency == null
                || registerDto.SkillLevel == null)
                return BadRequest("Please complete the registration form");

            // return bad request if the requested username already exists
            if (await UserExists(registerDto.Username)) return BadRequest("Username is taken");

            // map the registerDto data to a user object
            var user = _mapper.Map<AppUser>(registerDto);

            // front-end checks exist, but just in case, convert these to lowercase before saving.
            user.UserName = registerDto.Username.ToLower();
            user.FirstName = registerDto.FirstName.ToLower();
            user.LastName = registerDto.LastName.ToLower();

            // creates user and saves changes into DB with ASPNET identity's user manager
            var result = await _userManager.CreateAsync(user, registerDto.Password);

            // if there were problems saving, retrun bad request with the errors
            if (!result.Succeeded) return BadRequest(result.Errors);

            // If successful, give the user a Role (defualt to a member role for normal users);
            var roleResults = await _userManager.AddToRoleAsync(user, "Member");

            // if there were problems creating the roles, return bad request with errors.
            if (!roleResults.Succeeded) return BadRequest(result.Errors);

            // Finally, return the user with the JSON Web Token (JWT)
            return new UserDto
            {
                Username = user.UserName,
                Token = await _tokenService.CreateToken(user),
                FirstName = user.FirstName,
                LastName = user.LastName
            };
        }

        /*
            HttpPost API for logging in users.
        */
        /// <summary>
        /// HttpPost API for logging in users.
        /// </summary>
        /// <returns>
        /// The UserDto, once the user is validated (data transfer object containing useful user information, including their JWT)
        /// </returns>
        /// <param name="loginDto">Login data transfer object that contains the username and password</param>
        [HttpPost("login")]
        public async Task<ActionResult<UserDto>> Login(LoginDto loginDto)
        {
            if (loginDto.Username == null || loginDto.Password == null) return BadRequest("Please provide your username and password");
            // _context.Users does not have photos attached to a user, so we need to Include that.
            var user = await _userManager.Users
                .Include(p => p.Photos)
                .SingleOrDefaultAsync(x => x.UserName == loginDto.Username.ToLower());

            // if no user exists with that username, return unauthorized
            if (user == null) return Unauthorized("Invalid username");

            // check the user's credentials using ASPNET identiy's sign in manager
            var result = await _signInManager
                .CheckPasswordSignInAsync(user, loginDto.Password, false);

            if (!result.Succeeded) return Unauthorized();

            return new UserDto
            {
                Username = user.UserName,
                Token = await _tokenService.CreateToken(user),
                PhotoUrl = user.Photos.FirstOrDefault(x => x.IsMain)?.Url,
                FirstName = user.FirstName,
                LastName = user.LastName
            };
        }


        /*
            HttpPost API for updatinga user's password.
        */
        /// <summary>
        /// HttpPost API for updatinga user's password.
        /// </summary>
        /// <param name="credentialsUpdateDto">DTO that contains the current password and new password</param>
        // route api/account/updateCredentials
        [HttpPost("updateCredentials")]
        public async Task<ActionResult> UpdateCredentials(CredentialsUpdateDto credentialsUpdateDto)
        {
            // get the current user from the Claims Principal.
            var user = await _unitOfWork.UserRepository.GetUserByUsernameAsync(User.GetUsername());

            // confirm that they provided a correct current password.
            var confirmPassword = await _signInManager
                .CheckPasswordSignInAsync(user, credentialsUpdateDto.Password, false);

            // if not, return unauthorized with the appropriate message.
            if (!confirmPassword.Succeeded) return Unauthorized("Current password is incorrect.");

            // if they made it, use ASPNET Identity User Manager to reset the password
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, token, credentialsUpdateDto.NewPassword);

            // if it failed reseting the password, return bad request with errors.
            if (!result.Succeeded) return BadRequest(result.Errors);

            user.UpdatedAt = DateTime.UtcNow;

            // ASPNET Identity should auto-save the new password, but update the database with the other changes
            _unitOfWork.UserRepository.Update(user);

            // Then save changes to the db and return 204NoContent.
            if (await _unitOfWork.Complete()) return NoContent();

            // return 400BadRequest if all fails.
            return BadRequest("Failed to update password");
        }

        /// <summary>
        /// Primary route for user's to delete their account.
        /// </summary>
        [HttpDelete("delete-account")]
        public async Task<ActionResult> DeleteAccount()
        {
            // get the user to delete from the claims principle.
            var user = await _userManager.FindByNameAsync(User.GetUsername());

            // 1. Delete all their photos
            var photos = await _unitOfWork.PhotoRepository.GetUsersPhotos(user.UserName);
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
            var allMessages = await _unitOfWork.MessageRepository.GetAllUsersMessages(user.UserName);
            if (allMessages.Count() > 0)
            {
                // no need to check if sender deleted or recipient deleted here. Just delete it no matter what.
                // TODO: in the future see if you can keep the message history, like facebook does with deleted/deactivated profiles. For now, delete the entire profile and all messages.
                _unitOfWork.MessageRepository.DeleteMessages(allMessages);
            }

            // 3. Delete their message groups and any remaining connections on that group (should remove automatically when they leave a hub)
            // but in case there are any existing hubs with this username and connection.
            var groups = await _unitOfWork.MessageRepository.GetMessageGroupsByUsername(user.UserName);
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
                if (!deleteRolesResult.Succeeded) return BadRequest("Encountered an error while trying to delete your account.");
            }

            // 5...and finally delete the user.
            var result = await _userManager.DeleteAsync(user);
            // ASPNET identity takes care of saving the db changes for us
            // if it didn't succeed, return bad request
            if (!result.Succeeded) return BadRequest("Encountered an error while trying to delete your account.");

            // check if _unitOfWork has changes (other than ASPNET Identity)
            if (_unitOfWork.HasChanges())
            {
                // save if the changes exist
                if (await _unitOfWork.Complete()) return Ok();
                // if issues with this, return bad request
                return BadRequest("Encountered an error while trying to delete your account.");
            }
            // if we make it here, no EF changes were made. Delete was successful.
            return Ok();
        }

        /// <summary>
        /// Private method to check if the username already exists
        /// </summary>
        private async Task<bool> UserExists(string username)
        {
            return await _userManager.Users.AnyAsync(x => x.UserName == username.ToLower());
        }
    }
}
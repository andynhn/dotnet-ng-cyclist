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
        public AccountController(UserManager<AppUser> userManager, SignInManager<AppUser> signInManager, ITokenService tokenService, IMapper mapper, IUnitOfWork unitOfWork)
        {
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
            if (await UserExists(registerDto.Username)) return BadRequest("Username is taken");

            var user = _mapper.Map<AppUser>(registerDto);

            // convert these to lowercase before saving.
            user.UserName = registerDto.Username.ToLower();

            // creates user and saves changes into DB with ASPNET identity's user manager
            var result = await _userManager.CreateAsync(user, registerDto.Password);

            if (!result.Succeeded) return BadRequest(result.Errors);

            // give the user a Role (member role for normal users);
            var roleResults = await _userManager.AddToRoleAsync(user, "Member");

            if (!roleResults.Succeeded) return BadRequest(result.Errors);

            // now return the username with the JSON Web Token (JWT)
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
            // _context.Users does not have photos attached, so we need to Include that.
            var user = await _userManager.Users
                .Include(p => p.Photos)
                .SingleOrDefaultAsync(x => x.UserName == loginDto.Username.ToLower());

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
            if (!result.Succeeded) return BadRequest(result.Errors);

            user.UpdatedAt = DateTime.UtcNow;

            // (ASPNET Identity should do this automatically...look into this) Update the database with the new changes.
            _unitOfWork.UserRepository.Update(user);
            // save changes to the db then return 204NoContent.
            if (await _unitOfWork.Complete()) return NoContent();
            // return 400BadRequest if all fails.
            return BadRequest("Failed to update password");
        }

        private async Task<bool> UserExists(string username)
        {
            return await _userManager.Users.AnyAsync(x => x.UserName == username.ToLower());
        }
    }
}
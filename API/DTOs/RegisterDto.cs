using System;
using System.ComponentModel.DataAnnotations;

namespace API.DTOs
{
    /*
        Data Transfer Object to help transfer user data on register.
        Accessed by AccountController and passed as a parameter to the Register() method.
    */
    /// <summary>
    /// Data Transfer Object to help transfer user data on register.
    /// Accessed by AccountController and passed as a parameter to the Register() method.
    /// </summary>
    public class RegisterDto
    {
        [Required]
        public string Username { get; set; }
        [Required]
        public string FirstName { get; set; }
        [Required]
        public string LastName { get; set; }
        [Required]
        public string Gender { get; set; }
        [Required]
        public DateTime DateOfBirth { get; set; }
        [Required]
        public string City { get; set; }
        [Required]
        public string Country { get; set; }
        [Required]
        [StringLength(250, MinimumLength = 8)]
        public string Password { get; set; }
    }
}
using System;
using System.ComponentModel.DataAnnotations;

namespace API.DTOs
{
    /*
        Data Transfer Object to help transfer user data on register.
        Accessed by AccountController and passed as a parameter to the Register() method.
        Should have all information that is requested of the user during registration.
    */
    /// <summary>
    /// Data Transfer Object to help transfer user data on register.
    /// Accessed by AccountController and passed as a parameter to the Register() method.
    /// Should have all information that is requested of the user during registration.
    /// </summary>
    public class RegisterDto
    {
        [Required]
        [StringLength(30, MinimumLength = 3)]
        public string Username { get; set; }
        [Required]
        [StringLength(30)]
        public string FirstName { get; set; }
        [Required]
        [StringLength(30)]
        public string LastName { get; set; }
        [Required]
        public string Gender { get; set; }
        [Required]
        public DateTime DateOfBirth { get; set; }
        [Required]
        public string CyclingFrequency { get; set; }   // Daily, Weekly, Monthly
        [Required]
        public string CyclingCategory { get; set; } // Road, Gravel, Mountain
        [Required]
        public string SkillLevel { get; set; }    // Beginner, Intermediate, Advanced
        [Required]
        public string City { get; set; }
        [Required]
        public string State { get; set; }
        [Required]
        [StringLength(100, MinimumLength = 8)]
        public string Password { get; set; }
    }
}
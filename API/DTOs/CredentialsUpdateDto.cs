using System.ComponentModel.DataAnnotations;

namespace API.DTOs
{
    /*
        Data Transfer Object to help user's update their password. Takes the current password and the new password
    */
    /// <summary>
    /// Data Transfer Object to help user's update their password. Takes the current password and the new password
    /// </summary>
    public class CredentialsUpdateDto
    {
        [Required]
        [StringLength(100, MinimumLength = 8)]
        public string Password { get; set; }
        [Required]
        [StringLength(100, MinimumLength = 8)]
        public string NewPassword { get; set; }

    }
}
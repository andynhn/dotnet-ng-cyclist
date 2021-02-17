using System.ComponentModel.DataAnnotations;

namespace API.DTOs
{
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
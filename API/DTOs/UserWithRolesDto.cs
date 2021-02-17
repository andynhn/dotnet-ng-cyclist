using System.Collections.Generic;

namespace API.DTOs
{
    public class UserWithRolesDto
    {
        public int Id { get; set; }
        public string Username { get; set; }
        public ICollection<string> Roles { get; set; }

    }
}
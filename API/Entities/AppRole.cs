using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;

namespace API.Entities
{
    /*
        Entity for maintaining Roles in our app. As part of ASPNET Identity.
    */
    /// <summary>
    /// Entity for maintaining Roles in our app. As part of ASPNET Identity.
    /// </summary>
    public class AppRole : IdentityRole<int>
    {
        public ICollection<AppUserRole> UserRoles { get; set; }
    }
}
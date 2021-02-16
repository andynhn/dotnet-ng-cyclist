using System;
using System.Collections;
using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;

namespace API.Entities
{
    /*
        Entity for AppUsers in our app. As part of ASPNET Identity.
        Note: Id, UserName, and PasswordHash are provided by IdentityUser, so they are omitted here.
    */
    /// <summary>
    /// Note: Id, UserName, and PasswordHash are provided by IdentityUser, so they are omitted here.
    /// </summary>
    public class AppUser : IdentityUser<int>
    {
        public DateTime DateOfBirth { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastActive { get; set; } = DateTime.UtcNow;
        public string Gender { get; set; }
        public string Introduction { get; set; }
        public string Interests { get; set; }
        public string CyclingFrequency { get; set; }   // Daily, Weekly, Monthly
        public string CyclingCategory { get; set; } // Road, Gravel, Mountain
        public string SkillLevel { get; set; }    // Beginner, Intermediate, Advanced
        public string City { get; set; }
        public string State { get; set; }
                
        // Relationships with other entities...

        // one to many - 1 user can have many photos
        public ICollection<Photo> Photos { get; set; }

        // many to many - 1 user can have many roles. 1 role can have many users.
        public ICollection<AppUserRole> UserRoles { get; set; }

        public ICollection<Message> MessagesSent { get; set; }
        public ICollection<Message> MessagesReceived { get; set; }
    }
}
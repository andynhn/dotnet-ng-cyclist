using System;
using System.Collections.Generic;

namespace API.DTOs
{
    /*
        Data Transfer Object to help transfer user data to a member object that we can use client-side
    */
    /// <summary>
    /// Data Transfer Object to help transfer user data to a member object that we can use client-side
    /// </summary>
    public class MemberDto
    {
        public int Id { get; set; }
        public string Username { get; set; }
        public string PhotoUrl { get; set; }
        public int Age { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime LastActive { get; set; }
        public string Introduction { get; set; }
        public string Interests { get; set; }
        public string City { get; set; }
        public string Country { get; set; }

        // one to many - 1 user can have many photos
        public ICollection<PhotoDto> Photos { get; set; }
    }
}
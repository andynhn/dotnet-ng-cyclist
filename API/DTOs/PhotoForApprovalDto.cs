using System;

namespace API.DTOs
{
    /*
        Data Transfer Object to aid admins in approving photos
    */
    /// <summary>
    /// Data Transfer Object to aid admins in approving photos
    /// </summary>
    public class PhotoForApprovalDto
    {
        public int Id { get; set; }
        public string Url { get; set; }
        public string Username { get; set; }
        public bool IsApproved { get; set; }
        public string State { get; set; }   // provide state and city for moderation assistance. 
        public string City { get; set; } // Assign approval responsiblities to moderators and assign them a state or city.
        public DateTime LastActive { get; set; }
    }
}
namespace API.DTOs
{
    /*
        Data Transfer Object to aid in updating app user information
    */
    /// <summary>
    /// Data Transfer Object to aid in updating app user information
    /// </summary>
    public class MemberUpdateDto
    {
        public string Introduction { get; set; }
        public string Interests { get; set; }
        public string CyclingFrequency { get; set; }   // Daily, Weekly, Monthly
        public string CyclingCategory { get; set; } // Road, Gravel, Mountain
        public string SkillLevel { get; set; }    // Beginner, Intermediate, Advanced
        public string City { get; set; }
        public string State { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
    }
}
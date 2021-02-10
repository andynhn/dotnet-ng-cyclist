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
        public string City { get; set; }
        public string Country { get; set; }
    }
}
namespace API.DTOs
{
    /*
        Data Transfer Object to help transfer user data client-side, including the JWT
    */
    /// <summary>
    /// Data Transfer Object to help transfer user data client-side, including the JWT
    /// </summary>
    public class UserDto
    {
        public string Username { get; set; }
        public string Token { get; set; }
        public string PhotoUrl { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
    }
}
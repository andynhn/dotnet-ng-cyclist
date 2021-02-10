namespace API.DTOs
{
    /*
        Data Transfer Object to help transfer user data on login.
        Accessed by AccountController and passed as a parameter to the Login() method.
    */
    /// <summary>
    /// Data Transfer Object to help transfer user data on login.
    /// Accessed by AccountController and passed as a parameter to the Login() method.
    /// </summary>
    public class LoginDto
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }
}
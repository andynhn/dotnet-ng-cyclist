using System.Security.Claims;

namespace API.Extensions
{
    /*
        Static class for extending the ClaimsPrincipal.
        These methods help access information based on data in the ClaimsPrincipal
        E.g. Inside a Controller we have access to a Claims Principal for the User.
        "User.GetUsername()" gets the username from that Claims Principal
        We want to find the claim that matches the name identifier, which is the claim that we give the user in their JWT.
    */
    /// <summary>
    /// Static class for extending the ClaimsPrincipal.
    /// These methods help access information based on data in the ClaimsPrincipal
    /// E.g. Inside a Controller we have access to a Claims Principal for the User.
    /// "User.GetUsername()" gets the username from that Claims Principal
    /// We want to find the claim that matches the name identifier, which is the claim that we give the user in their JWT.
    /// </summary>
    public static class ClaimsPrincipalExtensions
    {
        /// <summary>
        /// Extension method for getting a username, based on the User in the ClaimsPrincipal.
        /// </summary>
        public static string GetUsername(this ClaimsPrincipal user)
        {
            // ClaimTypes.Name is the UniqueName property that we set in our TokenService. (even though it's slightly different)
            return user.FindFirst(ClaimTypes.Name)?.Value;
        }

        /// <summary>
        /// Extension method for getting a user Id, based on the User in the ClaimsPrincipal.
        /// </summary>
        public static int GetUserId(this ClaimsPrincipal user)
        {
            // ClaimTypes.NameIdentifier is the NameId property that we set inside our TokenService. (even though it's slightly different)
            // NOTE: our user id is of type int, in this case.
            return int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)?.Value);
        }
    }
}
using System;
using System.Threading.Tasks;
using API.Extensions;
using API.Interfaces;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;

namespace API.Helpers
{
    /*
        Class for logging user activity, so that we can update LastActive properties
        Must configure in our services within startup.
        Then add this to BaseApiController so that all of our controllers have access to this.
    */
    /// <summary>
    /// Class for logging user activity, so that we can update LastActive properties
    /// Must configure in our services within startup.
    /// Then add this to BaseApiController so that all of our controllers have access to this.
    /// </summary>
    public class LogUserActivity : IAsyncActionFilter
    {
        /// <summary>
        /// This method updates the lastActive property for a logged in user to now.
        /// </summary>
        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var resultContext = await next();
            // make sure user is authenticated first.
            if (!resultContext.HttpContext.User.Identity.IsAuthenticated) return;

            // get userId from User claims principle and extension method.
            var userId = resultContext.HttpContext.User.GetUserId();
            // get unit of work repository
            var unitOfWork = resultContext.HttpContext.RequestServices.GetService<IUnitOfWork>();
            // get user from repository using userId from claims principal
            var user = await unitOfWork.UserRepository.GetUserByIdAsync(userId);
            // if a user exists, update the last active to now (e.g. when a user deletes their account);
            if (user != null) {
                // set LastActive to Utc Now.
                user.LastActive = DateTime.UtcNow;
            }
            // async save to repository.
            await unitOfWork.Complete();
        }
    }
}
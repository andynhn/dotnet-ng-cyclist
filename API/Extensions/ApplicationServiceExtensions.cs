using API.Data;
using API.Helpers;
using API.Interfaces;
using API.Services;
using API.SignalR;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace API.Extensions
{
    /*
        Primary class for configuring application services.
        Triggered in Startup.cs ConfigureServices method.
        Separated as a separate class to clean up the Start up class.
        New services need to be configured here in order to be used in the app.
    */
    /// <summary>
    /// Primary class for configuring application services.
    /// Triggered in Startup.cs ConfigureServices method.
    /// Separated as a separate class to clean up the Start up class.
    /// New services need to be configured here in order to be used in the app.
    /// </summary>
    public static class ApplicationServiceExtensions
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration config)
        {
            // Since our "presence tracker dictionary" is a service that is shared with every connection coming into our server, we add it as a Singleton
            // NOTE: scalability issues. But we've locked our dictionary while others access, etc.
            // To scale, use something like Redis or save to your DB rather than tracking presence in memory
            services.AddSingleton<PresenceTracker>();
            
            // Need to configure cloudinary based on keys set in our config files.
            services.Configure<CloudinarySettings>(config.GetSection("CloudinarySettings"));
            
            // addscoped because we want it to be scoped to the context of a request.
            services.AddScoped<ITokenService, TokenService>();
            services.AddScoped<IPhotoService, PhotoService>();
            
            // unit of work will take care of saving changes for our repositories. Our repos will use the datacontext that is injected into the unit of work.
            services.AddScoped<IUnitOfWork, UnitOfWork>();
            
            // Custom service to help log user activity, and update Last Active, etc.
            services.AddScoped<LogUserActivity>();
            
            // Add Automapper configuration here
            services.AddAutoMapper(typeof(AutoMapperProfiles).Assembly);

            // configure the DataContext here and specify where to get the connections tring.
            services.AddDbContext<DataContext>(options =>
            {
                // currently specified in appsettings.Development.json
                options.UseSqlite(config.GetConnectionString("DefaultConnection"));
            });
            
            // finally, return the services so that Startup.cs can use this
            return services;
        }
    }
}
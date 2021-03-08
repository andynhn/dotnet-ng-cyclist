using System;
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
                var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");

                string connStr;

                // Depending on if in development or production, use either Heroku-provided
                // connection string, or development connection string from env var.
                if (env == "Development")
                {
                    // Use connection string from file.
                    connStr = config.GetConnectionString("DefaultConnection");
                }
                else
                {
                    // Use connection string provided at runtime by Heroku.
                    var connUrl = Environment.GetEnvironmentVariable("DATABASE_URL");

                    // Parse connection URL to connection string for Npgsql
                    connUrl = connUrl.Replace("postgres://", string.Empty);
                    var pgUserPass = connUrl.Split("@")[0];
                    var pgHostPortDb = connUrl.Split("@")[1];
                    var pgHostPort = pgHostPortDb.Split("/")[0];
                    var pgDb = pgHostPortDb.Split("/")[1];
                    var pgUser = pgUserPass.Split(":")[0];
                    var pgPass = pgUserPass.Split(":")[1];
                    var pgHost = pgHostPort.Split(":")[0];
                    var pgPort = pgHostPort.Split(":")[1];

                    connStr = $"Server={pgHost};Port={pgPort};User Id={pgUser};Password={pgPass};Database={pgDb};SSL Mode=Require;TrustServerCertificate=True";
                }

                // Whether the connection string came from the local development configuration file
                // or from the environment variable from Heroku, use it to set up your DbContext.
                options.UseNpgsql(connStr);
            });
            
            // finally, return the services so that Startup.cs can use this
            return services;
        }
    }
}
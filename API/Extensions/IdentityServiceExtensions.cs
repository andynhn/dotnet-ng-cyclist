using System.Text;
using System.Threading.Tasks;
using API.Data;
using API.Entities;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace API.Extensions
{
    /*
        Primary class for configuring identity services.
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
    public static class IdentityServiceExtensions
    {
        public static IServiceCollection AddIdentityServices(this IServiceCollection services, IConfiguration config)
        {
            // Need to AddIdentityCore to configure the app to use ASPNET Identity.
            // since this app a SPA using Angular with token-based auth, we want AddIdentityCore, while adding extras that we need.
            services.AddIdentityCore<AppUser>(opt => 
            {
                opt.Password.RequireNonAlphanumeric = false;
            })
                .AddRoles<AppRole>()
                .AddRoleManager<RoleManager<AppRole>>() // Role Manager and the Type that it's going to use
                .AddSignInManager<SignInManager<AppUser>>() // Sign in Manager and the Type that it's going to use
                .AddRoleValidator<RoleValidator<AppRole>>() // Role Validator and the type that it needs to use
                .AddEntityFrameworkStores<DataContext>();   // DataContext so that it sets up the DB with all the tables that we need for the dotnet identity tables.

            // Configure authentication so that we can use JSON Web Tokens.
            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options => 
                {
                    // token key specified in our config files.
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["TokenKey"])),
                        ValidateIssuer = false,
                        ValidateAudience = false
                    };

                });

            // Configure authorization (e.g. Roles) to include Admin and Moderator roles.
            services.AddAuthorization(opt => 
            {
                opt.AddPolicy("RequireAdminRole", policy => policy.RequireRole("Admin"));
                opt.AddPolicy("ModeratePhotoRole", policy => policy.RequireRole("Admin", "Moderator"));
            });

            // finally return services so that our Startup class can use this.
            return services;
        }

    }
}
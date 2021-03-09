using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using API.Extensions;
using API.Middleware;
using API.SignalR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.OpenApi.Models;

namespace API
{
    public class Startup
    {
        private readonly IConfiguration _config;
        public Startup(IConfiguration config)
        {
            _config = config;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            // --------------------------------------------------HTTP/HTTPS REDIRECT--------------------------------------------------
            services.Configure<ForwardedHeadersOptions>(options =>
            {
                options.ForwardedHeaders =
                    ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            });

            services.AddHsts(options =>
            {
                options.Preload = true;
                options.IncludeSubDomains = true;
                // set to 1 day. if not set, defaults to 30. Set the value from hours to no more than a single day in case you need to revert the HTTPS infrastructure to HTTP. 
                // After you're confident in the sustainability of the HTTPS configuration, increase the HSTS max-age value; a commonly used value is one year.
                options.MaxAge = TimeSpan.FromDays(1);  
            });

            // The middleware defaults to sending a Status307TemporaryRedirect with all redirects. 
            // If you prefer to send a permanent redirect status code when the app is in a non-Development environment, wrap 
            // the middleware options configuration in a conditional check for a non-Development environment.
            if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
            {
                services.AddHttpsRedirection(options =>
                {
                    options.RedirectStatusCode = StatusCodes.Status307TemporaryRedirect;
                    options.HttpsPort = 5001;
                });
            } else {
                services.AddHttpsRedirection(options =>
                {
                    options.RedirectStatusCode = StatusCodes.Status308PermanentRedirect;
                    options.HttpsPort = 443;
                });
            }

            // --------------------------------------------------HTTP/HTTPS REDIRECT--------------------------------------------------

            // gives us access to our custom extension method from ApplicationServiceExtensions.cs
            services.AddApplicationServices(_config);

            services.AddControllers();

            // implement cors
            services.AddCors();

            // custom extension method for identity related services from IdentityServiceExtensions.cs
            services.AddIdentityServices(_config);

            // need to add signal R to services here
            services.AddSignalR();

            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "API", Version = "v1" });
            });
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            // Exception handling comes first. This is our custom exception handling middleware.
            app.UseMiddleware<ExceptionMiddleware>();
            // --------------------------------------------------HTTP/HTTPS REDIRECT--------------------------------------------------
            if (env.IsDevelopment())
            {
                app.UseForwardedHeaders();
            }
            else
            {
                // Forwarded Headers Middleware should run before other middleware. This ordering ensures that the middleware relying on 
                // forwarded headers information can consume the header values for processing. 
                // Forwarded Headers Middleware can run after diagnostics and error handling, but it must be run before calling UseHsts
                app.UseForwardedHeaders();
                app.UseHsts();
            }
            // --------------------------------------------------HTTP/HTTPS REDIRECT--------------------------------------------------

            // commented out for now in order to use our own custom exception handling middleware (above)
            // if (env.IsDevelopment())
            // {
            //     app.UseDeveloperExceptionPage();
            //     app.UseSwagger();
            //     app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "API v1"));
            // }

            app.UseHttpsRedirection();
            app.UseRouting();

            // order matters here. UseCors, then UseAuthentication, then UseAuthorization
            app.UseCors(x => x.AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials()
                .WithOrigins("https://localhost:4200"));     // define the origins of angular app.

            // Authenticatin with JWT and Authorization using ASPNET Identity roles.
            app.UseAuthentication();
            app.UseAuthorization();

            app.UseDefaultFiles();  // if there is an index.html inside there, it will use that (our angular app uses it)
            app.UseStaticFiles();   // need this to serve angular static files


            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
                // need to add Signal R hub here. Specify the hubs.
                // For tracking online presence.
                endpoints.MapHub<PresenceHub>("hubs/presence");
                // for our message hub
                endpoints.MapHub<MessageHub>("hubs/message");
                // configure endpoint to hit our fallback controlller, to help serve Angualr app from index.html in wwwroot folder in production
                // Index is the name of the action (only 1 method in the fallback controller), then the name of the controller
                endpoints.MapFallbackToController("Index", "Fallback");
            });
        }
    }
}

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
            // ---------------------------------------------------------------------------------------------------------------------
            // --------------------HTTP/HTTPS REDIRECT LOGIC------------------------------------------------------------------------
            // https://docs.microsoft.com/en-us/aspnet/core/host-and-deploy/proxy-load-balancer?view=aspnetcore-2.2#forward-the-scheme-for-linux-and-non-iis-reverse-proxies
            // To forward the scheme from the proxy in non-IIS scenarios, add and configure Forwarded Headers Middleware. 
            // In Startup.ConfigureServices, use the following code:
            // NOTE: ASPNETCORE_FORWARDEDHEADERS_ENABLED is set within the Heroku config 
            if (string.Equals(
                Environment.GetEnvironmentVariable("ASPNETCORE_FORWARDEDHEADERS_ENABLED"), 
                "true", StringComparison.OrdinalIgnoreCase))
            {
                services.Configure<ForwardedHeadersOptions>(options =>
                {
                    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | 
                        ForwardedHeaders.XForwardedProto;
                    // Only loopback proxies are allowed by default.
                    // Clear that restriction because forwarders are enabled by explicit 
                    // configuration.
                    options.KnownNetworks.Clear();
                    options.KnownProxies.Clear();
                });
            }

            // Conditional that helps middleware redirect from HTTP to HTTPS, depending on the environment
            if (string.Equals(
                Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"), 
                "Development", StringComparison.OrdinalIgnoreCase))
            {
                services.AddHttpsRedirection(options =>
                {
                    options.RedirectStatusCode = StatusCodes.Status307TemporaryRedirect;
                    options.HttpsPort = 5001;
                });
            } 
            else 
            {
                services.AddHttpsRedirection(options =>
                {
                    options.RedirectStatusCode = StatusCodes.Status308PermanentRedirect;
                    options.HttpsPort = 443;
                });
            }

            // --------------------END HTTP/HTTPS REDIRECT LOGIC------------------------------------------------------------------------

            services.AddApplicationServices(_config);   // gives us access to our custom extension method from ApplicationServiceExtensions.cs
            services.AddControllers();
            services.AddCors();                         // implement cors
            services.AddIdentityServices(_config);      // custom extension method for identity related services from IdentityServiceExtensions.cs
            services.AddSignalR();                      // add signalR to services for live-chatting and real-time functionality

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

            // --------------------BEGIN HTTP/HTTPS REDIRECT LOGIC USING FORWARDED HEADERS------------------------------------------------

            // https://docs.microsoft.com/en-us/aspnet/core/host-and-deploy/proxy-load-balancer?view=aspnetcore-5.0#forwarded-headers-middleware-options
            // App is on Heroku which serves HTTP Routing through a layer of reverse proxies.
            // For Heroku, redirects need to be performed at the application level as the Heroku router does not provide this functionality. 
            // You should code the redirect logic into your application. Under the hood, Heroku router (over)writes the X-Forwarded-Proto...
            // ... and the X-Forwarded-Port request headers. The app must check X-Forwarded-Proto and respond with a redirect response when it is not https but http.
            // Configure your server to only accepts clients whose X-Forwarded-Proto request header is set to https.
            app.UseForwardedHeaders();

            // Below is used to log the headers (need to DI ILogger<Startup> logger)
            // app.Use(async (context, next) =>
            // {
            //     // Request method, scheme, and path
            //     logger.LogInformation("REQUEST METHOD: {Method}", context.Request.Method);
            //     logger.LogInformation("REQUEST SCHEME: {Scheme}", context.Request.Scheme);
            //     logger.LogInformation("REQUEST PATH: {Path}", context.Request.Path);
            //     // Headers
            //     foreach (var header in context.Request.Headers)
            //     {
            //         logger.LogInformation("HEADER: {Key}: {Value}", header.Key, header.Value);
            //     }
            //     // Connection: RemoteIp
            //     logger.LogInformation("REQUEST REMOTE IP: {RemoteIpAddress}", 
            //         context.Connection.RemoteIpAddress);
            //     await next();
            // });

            // below is used to send the headers as a response to the app.
            // To write the headers to the app's response, place the following terminal inline middleware immediately after the call to UseForwardedHeaders in Startup.Configure:
            // app.Run(async (context) =>
            // {
            //     context.Response.ContentType = "text/plain";
            //     // Request method, scheme, and path
            //     await context.Response.WriteAsync(
            //         $"Request Method: {context.Request.Method}{Environment.NewLine}");
            //     await context.Response.WriteAsync(
            //         $"Request Scheme: {context.Request.Scheme}{Environment.NewLine}");
            //     await context.Response.WriteAsync(
            //         $"Request Path: {context.Request.Path}{Environment.NewLine}");
            //     // Headers
            //     await context.Response.WriteAsync($"Request Headers:{Environment.NewLine}");
            //     foreach (var header in context.Request.Headers)
            //     {
            //         await context.Response.WriteAsync($"{header.Key}: " +
            //             $"{header.Value}{Environment.NewLine}");
            //     }
            //     await context.Response.WriteAsync(Environment.NewLine);
            //     // Connection: RemoteIp
            //     await context.Response.WriteAsync(
            //         $"Request RemoteIp: {context.Connection.RemoteIpAddress}");
            // });


            // --------------------END HTTP/HTTPS REDIRECT LOGIC USING FORWARDED HEADERS--------------------------------------------


            // commented out for now in order to use our own custom exception handling middleware (above)
            // if (env.IsDevelopment())
            // {
            //     app.UseDeveloperExceptionPage();
            //     app.UseSwagger();
            //     app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "API v1"));
            // }

            app.UseHttpsRedirection();  // adds middleware for directing HTTP requests to HTTPS
            app.UseRouting();

            // order matters here. UseCors, then UseAuthentication, then UseAuthorization
            app.UseCors(x => x.AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials()
                .WithOrigins("https://localhost:4200"));     // define the origins of angular app.

            app.UseAuthentication();   // Authenticating with JWT and Authorization using ASPNET Identity roles.
            app.UseAuthorization();

            app.UseDefaultFiles();     // if there is an index.html inside there, it will use that (our angular app uses it)
            app.UseStaticFiles();      // need this to serve angular static files

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
                endpoints.MapHub<PresenceHub>("hubs/presence");     // need to add Signal R hub here. Specify the hubs. For tracking online presence.
                endpoints.MapHub<MessageHub>("hubs/message");       // for our message hub
                // configure endpoint to hit our fallback controlller, to help serve Angualr app from index.html in wwwroot folder in production.
                // Index is the name of the action (only 1 method in the fallback controller), then the name of the controller.
                endpoints.MapFallbackToController("Index", "Fallback");
            });
        }
    }
}

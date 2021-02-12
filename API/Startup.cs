using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using API.Extensions;
using API.Middleware;
using API.SignalR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
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


            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
                // need to add Signal R hub here. Specify the hubs.
                // For tracking online presence.
                endpoints.MapHub<PresenceHub>("hubs/presence");
                // for our message hub
                endpoints.MapHub<MessageHub>("hubs/message");
            });
        }
    }
}

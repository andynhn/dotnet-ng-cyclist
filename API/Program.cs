using System;
using System.Threading.Tasks;
using API.Data;
using API.Entities;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace API
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var host = CreateHostBuilder(args).Build();

            // this is where we populate our db with seed data. since we are outside the scope of our configure services in Startup.cs, 
            // we need to create scope again here to access our DataContext.
            using var scope = host.Services.CreateScope();
            var services = scope.ServiceProvider;

            // try/catch here because this is outside the scope of our exception middleware.
            try
            {
                var context = services.GetRequiredService<DataContext>();
                var userManager = services.GetRequiredService<UserManager<AppUser>>();
                var roleManager = services.GetRequiredService<RoleManager<AppRole>>();

                // migrate async applies any pending migrations for the context to the db. Creates db if it does not already exist.
                // instead of needing to run 'dotnet-ef database update', just restart the app to create db and apply migrations.
                // If we drop our db, just need to restart our app to recreate the db.
                await context.Database.MigrateAsync();

                // This is where we directly seed the database
                await Seed.SeedUsers(userManager, roleManager);
            }
            catch (Exception ex)
            {
                // log the error if an exception is caught.
                var logger = services.GetRequiredService<ILogger<Program>>();
                logger.LogError(ex, "An error occurred during migration");
            }

            // need to run the host at the end since we removed it from the default build statement.
            await host.RunAsync();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                });
    }
}

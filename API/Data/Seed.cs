using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using API.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace API.Data
{
    /*
        Primary class to create seed data from a json file, for development purposes. Triggered in Program.cs Main method
    */
    /// <summary>
    /// Primary class to create seed data from a json file, for development purposes. Triggered in Program.cs Main method
    /// </summary>
    public class Seed
    {
        // ASPNET identity gives us a userManager
        public static async Task SeedUsers(UserManager<AppUser> userManager, 
            RoleManager<AppRole> roleManager)
        {
            // don't seed the db if it already has users
            if (await userManager.Users.AnyAsync()) return;
            
            // get userData from json file.
            var userData = await System.IO.File.ReadAllTextAsync("Data/UserSeedData2.json");
            // deserialize the json file into a list of app users
            var users = JsonSerializer.Deserialize<List<AppUser>>(userData);

            // stop seeding if users is null
            if (users == null) return;

            // apply roles to the seeded users.
            var roles = new List<AppRole>
            {
                new AppRole{Name = "Member"},
                new AppRole{Name = "Admin"},
                new AppRole{Name = "Moderator"},
            };

            // create these roles and save them to db
            foreach (var role in roles)
            {
                await roleManager.CreateAsync(role);
            };

            // create the users and also assign them a role as member.
            foreach (var user in users)
            {
                // set the initial photo to approved for the seed users
                user.Photos.First().IsApproved = true;
                user.UserName = user.UserName.ToLower();
                user.FirstName = user.FirstName.ToLower();
                user.LastName = user.LastName.ToLower();

                // EF tracks and saves to DB here under ASPNET identity
                await userManager.CreateAsync(user, "Pa$$w0rd");
                await userManager.AddToRoleAsync(user, "Member");
            }

            // for dev purposes, seed an admin.
            var admin = new AppUser
            {
                UserName = "admin"
            };

            // save the admin to the db. Then given them the role of Admin and Moderator.
            await userManager.CreateAsync(admin, "Pa$$w0rd");
            await userManager.AddToRolesAsync(admin, new[] {"Admin", "Moderator"});
        }
    }
}
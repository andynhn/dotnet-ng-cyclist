using System;
using API.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace API.Data
{
    /*
        The primary DataContext file for contextualizing our DB via EntityFramework.
    */
    /// <summary>
    /// The primary DataContext file for contextualizing our DB via EntityFramework.
    /// </summary>
    public class DataContext : IdentityDbContext<AppUser, 
            AppRole, 
            int, 
            IdentityUserClaim<int>, 
            AppUserRole, 
            IdentityUserLogin<int>, 
            IdentityRoleClaim<int>, 
            IdentityUserToken<int>>
    {
        public DataContext(DbContextOptions options) : base(options)
        {
        }

        public DbSet<Photo> Photos { get; set; }
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // relationship between app user and user roles: an app user can have many user roles. 
            builder.Entity<AppUser>()
                .HasMany(ur => ur.UserRoles)
                .WithOne(u => u.User)
                .HasForeignKey(ur => ur.UserId)
                .IsRequired();

            // relationship bewteen app role and user roles: an app role can have many users.
            builder.Entity<AppRole>()
                .HasMany(ur => ur.UserRoles)
                .WithOne(u => u.Role)
                .HasForeignKey(ur => ur.RoleId)
                .IsRequired();

            // add a query filter to only return approved photos
            builder.Entity<Photo>()
                .HasQueryFilter(p => p.IsApproved);
                
            // Make sure all date time is in UTC format.
            builder.ApplyUtcDateTimeConverter();
        }
    }

    /*
        Static class that makes sure all dat time is in UTC format.
    */
    /// <summary>
    /// Static class that makes sure all dat time is in UTC format.
    /// </summary>
    public static class UtcDateAnnotation
    {
        private const String IsUtcAnnotation = "IsUtc";
        private static readonly ValueConverter<DateTime, DateTime> UtcConverter =
            new ValueConverter<DateTime, DateTime>(v => v, v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

        private static readonly ValueConverter<DateTime?, DateTime?> UtcNullableConverter =
            new ValueConverter<DateTime?, DateTime?>(v => v, v => v == null ? v : DateTime.SpecifyKind(v.Value, DateTimeKind.Utc));

        public static PropertyBuilder<TProperty> IsUtc<TProperty>(this PropertyBuilder<TProperty> builder, Boolean isUtc = true) =>
        builder.HasAnnotation(IsUtcAnnotation, isUtc);

        public static Boolean IsUtc(this IMutableProperty property) =>
        ((Boolean?)property.FindAnnotation(IsUtcAnnotation)?.Value) ?? true;

        /*
            Call this after configuring your entities.
        */
        /// <summary>
        /// Call this after configuring your entities.
        /// </summary>
        public static void ApplyUtcDateTimeConverter(this ModelBuilder builder)
        {
            foreach (var entityType in builder.Model.GetEntityTypes())
            {
                foreach (var property in entityType.GetProperties())
                {
                    if (!property.IsUtc())
                    {
                        continue;
                    }

                    if (property.ClrType == typeof(DateTime))
                    {
                        property.SetValueConverter(UtcConverter);
                    }

                    if (property.ClrType == typeof(DateTime?))
                    {
                        property.SetValueConverter(UtcNullableConverter);
                    }
                }
            }
        }
    }
}
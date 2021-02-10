using System.ComponentModel.DataAnnotations.Schema;

namespace API.Entities
{
    /*
        Entity for Photos in our app.
        PublicId property is needed for Cloudinary integration.
    */
    /// <summary>
    /// Entity for Photos in our app.
    /// </summary>
    [Table("Photos")]
    public class Photo
    {
        public int Id { get; set; }
        public string Url { get; set; }
        public bool IsMain { get; set; }
        public bool IsApproved { get; set; }

        // public id is a string needed for cloudinary integration
        public string PublicId { get; set; }

        // 1 to many - 1 user can have many photos.
        // Make sure on delete is "cascade" so that photos are deleted if user is deleted.
        public AppUser AppUser { get; set; }
        public int AppUserId { get; set; }
        
    }
}
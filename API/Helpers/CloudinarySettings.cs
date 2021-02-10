namespace API.Helpers
{
    /*
        Primary class for specifying Cloudinary settings.
    */
    /// <summary>
    /// Primary class for specifying Cloudinary settings.
    /// </summary>
    public class CloudinarySettings
    {
        public string CloudName { get; set; }
        public string ApiKey { get; set; }
        public string ApiSecret { get; set; }
    }
}
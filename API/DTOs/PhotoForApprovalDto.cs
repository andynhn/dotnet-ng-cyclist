namespace API.DTOs
{
    /*
        Data Transfer Object to aid admins in approving photos
    */
    /// <summary>
    /// Data Transfer Object to aid admins in approving photos
    /// </summary>
    public class PhotoForApprovalDto
    {
        public int Id { get; set; }
        public string Url { get; set; }
        public string Username { get; set; }
        public bool IsApproved { get; set; }
    }
}
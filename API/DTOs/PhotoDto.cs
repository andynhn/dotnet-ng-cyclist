namespace API.DTOs
{
    /*
        Data Transfer Object to aid in transfering photo information client-side
    */
    /// <summary>
    /// Data Transfer Object to aid in transfering photo information client-side
    /// </summary>
    public class PhotoDto
    {
        public int Id { get; set; }
        public string Url { get; set; }
        public bool IsMain { get; set; }
        public bool IsApproved { get; set; }
    }
}
namespace API.DTOs
{
    /*
        Data Transfer Object to help transfer message data
    */
    /// <summary>
    /// Data Transfer Object to help transfer message data
    /// </summary>
    public class CreateMessageDto
    {
        public string RecipientUsername { get; set; }
        public string Content { get; set; }
    }
}
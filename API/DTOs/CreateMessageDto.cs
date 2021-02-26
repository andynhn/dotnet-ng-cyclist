namespace API.DTOs
{
    /*
        Data Transfer Object to help transfer message data when creating a message
    */
    /// <summary>
    /// Data Transfer Object to help transfer message data when creating a message
    /// </summary>
    public class CreateMessageDto
    {
        public string RecipientUsername { get; set; }
        public string Content { get; set; }
    }
}
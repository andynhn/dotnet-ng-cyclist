using System;
using System.Text.Json.Serialization;

namespace API.DTOs
{
    /*
        Data Transfer Object used to help display messages between users in the chat thread
    */
    /// <summary>
    /// Data Transfer Object used to help display messages between users in the chat thread
    /// </summary>
    public class MessageDto
    {
        public int Id { get; set; }
        public int SenderId { get; set; }
        public string SenderUsername { get; set; }
        public string SenderFirstName { get; set; }
        public string SenderLastName { get; set; }
        public string SenderPhotoUrl { get; set; }
        public int RecipientId { get; set; }
        public string RecipientUsername { get; set; }
        public string RecipientFirstName { get; set; }
        public string RecipientLastName { get; set; }
        public string RecipientPhotoUrl { get; set; }
        public string Content { get; set; }
        public DateTime? DateRead { get; set; }
        public DateTime MessageSent { get; set; }

        // JsonIgnore will not send these properties back to the client, but we will have access to them in our repository after we projected to a MessageDto
        [JsonIgnore]
        public bool SenderDeleted { get; set; }
        [JsonIgnore]
        public bool RecipientDeleted { get; set; }
    }
}
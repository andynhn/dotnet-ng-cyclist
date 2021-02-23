namespace API.Helpers
{
    /// <summary>
    /// Helps with scrolled pagination and loading more messages for chat box infinite scrolling
    /// </summary>
    public class MemberChatParams : PaginationParams
    {
        public string RecipientUsername { get; set; }
    }
}
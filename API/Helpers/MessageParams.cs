namespace API.Helpers
{
    /*
        Messages Params, inheriting from PaginationParams, will help filter messages for an Inbox (read, unread, outbox)
    */
    /// <summary>
    /// Messages Params, inheriting from PaginationParams, will help filter messages for an Inbox (read, unread, outbox)
    /// </summary>
    public class MessageParams : PaginationParams
    {
        public string Username { get; set; }
        // set default container to "Unread" (the unread messages inbox)
        public string Container { get; set; } = "Unread";
    }
}
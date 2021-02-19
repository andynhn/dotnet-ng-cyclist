namespace API.Helpers
{
    public class PhotoManageParams : PaginationParams
    {
        public string UsernameSearch { get; set; }
        public string State { get; set; }
        public string City { get; set; }
        public string OrderBy { get; set; } = "lastActive";
    }
}
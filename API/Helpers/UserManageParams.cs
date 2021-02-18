namespace API.Helpers
{
    public class UserManageParams : PaginationParams
    {
        public string UsernameSearch { get; set; }
        public string Roles { get; set; }
        public string OrderBy { get; set; } = "aToZ";   // set default to Alphabetical sorting
    }
}
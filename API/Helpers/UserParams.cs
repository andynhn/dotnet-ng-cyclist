namespace API.Helpers
{
    /*
        User Params, inheriting from PaginationParams, will help filter Users in the main Discover users page
    */
    /// <summary>
    /// User Params, inheriting from PaginationParams, will help filter Users in the main Discover users page
    /// </summary>

    public class UserParams : PaginationParams
    {
        public string CurrentUsername { get; set; }
        public string Gender { get; set; }
        public int MinAge { get; set; } = 18;
        public int MaxAge { get; set; } = 150;
        public string OrderBy { get; set; } = "lastActive";
        public string CyclingFrequency { get; set; }   // Daily, Weekly, Monthly
        public string CyclingCategory { get; set; } // Road, Gravel, Mountain
        public string SkillLevel { get; set; }    // Beginner, Intermediate, Advanced
        public string NameSearch { get; set; }
    }
}
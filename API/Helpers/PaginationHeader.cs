namespace API.Helpers
{
    /*
        Will help send pagination data back to the client in the headers
    */
    /// <summary>
    /// Will help send pagination data back to the client in the headers
    /// </summary>
    public class PaginationHeader
    {
        public PaginationHeader(int currentPage, int itemsPerPage, int totalItems, int totalPages)
        {
            CurrentPage = currentPage;
            ItemsPerPage = itemsPerPage;
            TotalItems = totalItems;
            TotalPages = totalPages;
        }

        public int CurrentPage { get; set; }
        public int ItemsPerPage { get; set; }
        public int TotalItems { get; set; }
        public int TotalPages { get; set; }
        
    }
}
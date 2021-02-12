using System.Text.Json;
using API.Helpers;
using Microsoft.AspNetCore.Http;

namespace API.Extensions
{
    /*
        Static class for extending HTTP
        Specifcially, contains a static void AddPaginationHeader class that returns pagination information
        and stores that info in the Headers.
    */
    /// <summary>
    /// Static class for extending HTTP
    /// Specifcially, contains a static void AddPaginationHeader class that returns pagination information
    /// and stores that info in the Headers.
    /// </summary>
    public static class HttpExtensions
    {
        // Method to help add pagination data to the header in the HTTP Response
        public static void AddPaginationHeader(this HttpResponse response, int currentPage, int itemsPerPage, int totalItems, int totalPages)
        {
            var paginationHeader = new PaginationHeader(currentPage, itemsPerPage, totalItems, totalPages);

            var options = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };

            // spelling really matters here inside Add.
            response.Headers.Add("Pagination", JsonSerializer.Serialize(paginationHeader, options));
            response.Headers.Add("Access-Control-Expose-Headers", "Pagination");
        }
    }
}
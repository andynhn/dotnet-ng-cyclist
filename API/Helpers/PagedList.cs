using System.Collections.Generic;
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace API.Helpers
{
    /*
        PagedList object that we'll use to send back data as paged lists, to help with pagination.
    */
    /// <summary>
    /// PagedList object that we'll use to send back data as paged lists, to help with pagination.
    /// </summary>
    public class PagedList<T> : List<T>
    {
        public PagedList(IEnumerable<T> items, int count, int pageNumber, int pageSize)
        {
            CurrentPage = pageNumber;
            TotalPages = (int) Math.Ceiling(count / (double) pageSize);
            PageSize = pageSize;
            TotalCount = count;
            AddRange(items);
        }
        public int CurrentPage { get; set; }
        public int TotalPages { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }

        /// <summary>
        /// Generates a PagedList of data, given the query source, a pageNumber, and pageSize
        /// This method is optimized for Pagination
        /// </summary>
        public static async Task<PagedList<T>> CreateAsync(IQueryable<T> source, int pageNumber, int pageSize)
        {
            var count = await source.CountAsync();
            // source will have a list of results from the query.
            // E.g.: If page 3 and pagesize 10, we want to skip results from page 2 and 1. So "Skip" would skip 20 results
            // from the total results then we "take" the page size of items (10 items in this example) then return it to a list.
            var items = await source.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();


            return new PagedList<T>(items, count, pageNumber, pageSize);
        }

        /// <summary>
        /// Generates a PagedList of data, given the query source, a pageNumber, and pageSize
        /// This method is optimized for "Scrolled Pagination" aka infinite scrolling
        /// </summary>
        public static async Task<PagedList<T>> CreateScrolledAsync(IQueryable<T> source, int pageNumber, int pageSize)
        {
            // store the total count of results from the Query source.
            var count = await source.CountAsync();
            // when the user scrolls up in their chat, that's a "another page".
            // E.g.: If page 3 and pagesize 10, we want to skip results from page 2 and 1. So "Skip" would skip 20 results
            // from the total results then we "take" the page size of items (10 items in this example) then return it to a list.
            // We then append these new items on the client-side, which already has the initial 20 loaded items.
            // NOTE: We reverse it here because we 'orderedByDescending' in the query. 'Take' takes from the front, so we need 
            // to reverse it in order to have the client-side chat box properly "scroll up to display older messages",
            // like in a typical message chat app.
            var items = await source.Skip((pageNumber - 1) * pageSize).Take(pageSize).Reverse().ToListAsync();

            return new PagedList<T>(items, count, pageNumber, pageSize);
        }
    }
}
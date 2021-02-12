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

        /*
            Create a new instance of our paged list class because that is what we're returning
            First get the count, the potential list of total items to be returned.
            Then actually get the items.
        */
        public static async Task<PagedList<T>> CreateAsync(IQueryable<T> source, int pageNumber, int pageSize)
        {
            var count = await source.CountAsync();
            var items = await source.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();


            return new PagedList<T>(items, count, pageNumber, pageSize);
        }
    }
}
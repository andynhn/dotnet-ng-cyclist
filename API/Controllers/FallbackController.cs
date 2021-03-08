using System.IO;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    public class FallbackController : Controller
    {
        // need this to help serve angular files (tell the API what to do with routes that it doesn't understand)
        // we tell it to go to index.html, because that's where our angular app is being served from in production
        public ActionResult Index()
        {
            // index.html is responsible for loading the angular app, and it knows what to do with the routes for the client-side app
            return PhysicalFile(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "index.html"), "text/HTML");
        }
    }
}
using API.Helpers;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    /*
        Custom base controller that inherits from ControllerBase. 
        App Controllers can inherit from this BaseApiController to gain access to universal properties,
        such as [ApiController], [Route("api/[controller]")], and custom service filters, like LogUserActivity.
    */
    /// <summary>
    /// Custom base controller that inherits from ControllerBase. 
    /// App Controllers can inherit from this BaseApiController to gain access to universal properties,
    /// such as [ApiController], [Route("api/[controller]")], and custom service filters, like LogUserActivity.
    /// </summary>
    [ServiceFilter(typeof(LogUserActivity))]
    [ApiController]
    [Route("api/[controller]")]
    public class BaseApiController : ControllerBase
    {
        
    }
}
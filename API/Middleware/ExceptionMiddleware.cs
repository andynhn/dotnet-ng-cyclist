using System;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using API.Errors;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace API.Middleware
{
    /*
        Custom middleware for handling api exceptions. Specified in Configure method in Startup.cs
    */
    /// <summary>
    /// Custom middleware for handling api exceptions. Specified in Configure method in Startup.cs
    /// </summary>
    public class ExceptionMiddleware
    {
        // RequestDelegate is what's coming up next in the middleware pipeline
        private readonly RequestDelegate _next;
        // ILogger logs the exception to the terminal
        private readonly ILogger<ExceptionMiddleware> _logger;
        private readonly IHostEnvironment _env;
        public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger, IHostEnvironment env)
        {
            _env = env;
            _logger = logger;
            _next = next;
        }

        /// <summary>
        /// Method for handling exceptions, which happens in the context of an http request.
        /// </summary>
        public async Task InvokeAsync(HttpContext context)
        {
            // use try catch here to catch the exception.
            try
            {
                // Get our context and pass the context on to the next piece of middleware. 
                // This lives at the top of our middleware. Anything below this will invoke next at some point. 
                // Any exception further down in the chain will get thrown up the chain. 
                // The exception middleware is at the top of the tree and it catches it at the end.
                await _next(context); 
            }
            catch (Exception ex)
            {
                // log the exception
                _logger.LogError(ex, ex.Message);
                context.Response.ContentType = "application/json";
                context.Response.StatusCode = (int) HttpStatusCode.InternalServerError;
                
                // if in development mode, return the actual message and stack trace details.
                // if not in development, return the status code and "internal server error"
                // use StackTrace? to prevent getting exceptions from that. We don't want exceptions in our our exception handling middleware.
                var response = _env.IsDevelopment() 
                    ? new ApiException(context.Response.StatusCode, ex.Message, ex.StackTrace?.ToString())
                    : new ApiException(context.Response.StatusCode, "Internal Server Error");
                
                var options = new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                };

                var json = JsonSerializer.Serialize(response, options);

                // Send the error response asynchronously as a json string
                await context.Response.WriteAsync(json);
            }
        }
    }
}
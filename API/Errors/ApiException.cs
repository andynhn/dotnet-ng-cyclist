namespace API.Errors
{
    /*
        Primary class to for our custom api exceptions. Accessed via our ExceptionMiddleware class
    */
    /// <summary>
    /// Primary class to for our custom api exceptions. Accessed via our ExceptionMiddleware class
    /// </summary>
    public class ApiException
    {
        // We cam also modify default values here (e.g. for message and details)
        public ApiException(int statusCode, string message = null, string details = null)
        {
            StatusCode = statusCode;
            Message = message;
            Details = details;
        }

        public int StatusCode { get; set; }
        public string Message { get; set; }
        public string Details { get; set; }
    }
}
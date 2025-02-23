using System;

namespace API.Extensions
{
    public static class DateTimeExtensions
    {
        /*
            Static method that calculates age given a date
            We use this so that users can filter user lists by age.
        */
        /// <summary>
        /// Static method that calculates age given a date
        /// We use this so that users can filter user lists by age.
        /// </summary>
        public static int CalculateAge(this DateTime dob)
        {
            var today = DateTime.Today;
            var age = today.Year - dob.Year;
            if (dob.Date > today.AddYears(-age)) age--;
            return age;
        }
    }
}
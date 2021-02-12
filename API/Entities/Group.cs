using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace API.Entities
{
    /*
        Entity for Groups in our app. For establishing message groups between two app users.
    */
    /// <summary>
    /// Entity for Groups in our app. For establishing message groups between two app users.
    /// </summary>
    public class Group
    {
        // need an empty constructor for entity framework here.
        public Group()
        {
        }

        public Group(string name)
        {
            Name = name;
        }

        // make the key the name, which we set later as hyphen-spearated usernames.
        [Key]
        public string Name { get; set; }
        public ICollection<Connection> Connections { get; set; } = new List<Connection>();
    }
}
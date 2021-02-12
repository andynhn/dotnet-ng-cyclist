using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace API.SignalR
{
    public class PresenceTracker
    {
        private static readonly Dictionary<string, List<string>> OnlineUsers = new Dictionary<string, List<string>>();

        // be careful here. this dictionary is shared to everyone connected to our server. 
        // A dictionary is not a thread safe resource. So we need to lock the dictionary.
        public Task<bool> UserConnected(string username, string connectionId)
        {
            bool isOnline = false;
            // we lock the dictionary here as a work around to the "non-thread-safe" nature of dictionaries
            // lock the dictionary until we finish doing what we're doing inside here.
            lock (OnlineUsers)
            {
                // check if we already have a key of that username (e.g. user is logged in on multiple devices)
                // if so, then add the connection Id to the list of strings that hold the connection id. 
                if (OnlineUsers.ContainsKey(username))
                {
                    OnlineUsers[username].Add(connectionId);
                }
                else
                {
                    // for a new connection
                    OnlineUsers.Add(username, new List<string> { connectionId });
                    isOnline = true;
                }
            }

            return Task.FromResult(isOnline);
        }

        public Task<bool> UserDisconnected(string username, string connectionId)
        {
            bool isOffline = false;
            lock (OnlineUsers)
            {
                // if the dictinoary does not contain the username as a key, they are offline.
                if (!OnlineUsers.ContainsKey(username)) return Task.FromResult(isOffline);

                // otherwise, they are online, so remove their connection id.
                // if that username has no more connection id's (aka count is 0), remove them from the dictionary
                OnlineUsers[username].Remove(connectionId);
                if (OnlineUsers[username].Count == 0)
                {
                    OnlineUsers.Remove(username);
                    isOffline = true;
                }
            }

            return Task.FromResult(isOffline);
        }

        /// <summary>
        /// Get's a string array of users that are currently logged in online from the OnlineUsers dictionary.
        /// </summary>
        public Task<string[]> GetOnlineUsers()
        {
            string[] onlineUsers;
            lock (OnlineUsers)
            {
                onlineUsers = OnlineUsers.OrderBy(k => k.Key).Select(k => k.Key).ToArray();
            }

            return Task.FromResult(onlineUsers);
        }

        /// <summary>
        /// Get's a List of connections for a particular username in the OnlineUsers dictionary.
        /// </summary>
        public Task<List<string>> GetConnectionsForUser(string username)
        {
            List<string> connectionIds;
            lock(OnlineUsers)
            {
                connectionIds = OnlineUsers.GetValueOrDefault(username);
            }

            return Task.FromResult(connectionIds);
        }
    }
}
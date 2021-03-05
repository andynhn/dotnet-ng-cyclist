using System.Collections.Generic;
using System.Threading.Tasks;
using API.DTOs;
using API.Entities;
using API.Helpers;

namespace API.Interfaces
{
    public interface IMessageRepository
    {
        // methods for signal r
        void AddGroup(Group group);
        void RemoveConnection(Connection connection);
        Task<Connection> GetConnection(string connectionId);
        Task<Group> GetMessageGroup(string groupName);
        Task<IEnumerable<Group>> GetMessageGroupsByUsername(string username);
        Task<Group> GetGroupForConnection(string connnectionId);
        void DeleteMessageGroups(IEnumerable<Group> groups);


        void AddMessage(Message message);
        void DeleteMessage(Message message);
        void DeleteMessages(IEnumerable<Message> messages);
        Task<Message> GetMessage(int id);
        Task<PagedList<MessageDto>> GetMessagesForUser(MessageParams messageParams);
        Task<IEnumerable<MessageDto>> GetMessageThread(string currentUsername, string recipientUsername);
        Task<IEnumerable<MessageDto>> GetScrolledMessageThread(string currentUsername, string recipientUsername, MemberChatParams memberChatParams);
        Task<int> GetUnreadMessagesCountForUser(string username);
        Task<IEnumerable<Message>> GetAllUsersReceivedMessages(string username);
        Task<IEnumerable<Message>> GetAllUsersSentMessages(string username);
        Task<IEnumerable<Message>> GetAllUsersMessages(string username);
    }
}
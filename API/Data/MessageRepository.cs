using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using API.DTOs;
using API.Entities;
using API.Helpers;
using API.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;

namespace API.Data
{
    public class MessageRepository : IMessageRepository
    {
        private readonly DataContext _context;
        private readonly IMapper _mapper;
        public MessageRepository(DataContext context, IMapper mapper)
        {
            _mapper = mapper;
            _context = context;
        }

        /// <summary>
        /// Add a group to the data context
        /// </summary>
        /// <param name="group">The group to add</param>
        public void AddGroup(Group group)
        {
            _context.Groups.Add(group);
        }

        /// <summary>
        /// add a message to the data context
        /// </summary>
        /// <param name="message">the message to add</param>
        public void AddMessage(Message message)
        {
            _context.Messages.Add(message);
        }

        /// <summary>
        /// delete a message
        /// </summary>
        /// <param name="message">the message to delete</param>
        public void DeleteMessage(Message message)
        {
            _context.Messages.Remove(message);
        }

        /// <summary>
        /// Asynchronously get a connection, given the connection id, from the data context.
        /// </summary>
        /// <param name="connectionId">The connection id</param>
        public async Task<Connection> GetConnection(string connectionId)
        {
            return await _context.Connections.FindAsync(connectionId);
        }

        /// <summary>
        /// Asynchronously get the group from the connection id
        /// </summary>
        /// <param name="connectionId">the connection id that corresponds to a group</param>
        public async Task<Group> GetGroupForConnection(string connnectionId)
        {
            return await _context.Groups
                .Include(c => c.Connections)
                .Where(c => c.Connections.Any(x => x.ConnectionId == connnectionId))
                .FirstOrDefaultAsync();
        }

        /// <summary>
        /// Asynchronously get the group from the connection id
        /// </summary>
        public async Task<IEnumerable<Group>> GetMessageGroupsByUsername(string username)
        {
            var query = _context.Groups.AsQueryable();
            // Group names are hyphen-separated keys of the two user's usernames, ordered alphabetically e.g. janesmith-johnsmith
            // A user's username could be at the front or the end, depending on the other user. So make a query that 
            // searches for if the given username is at the beginning or the end of the group name key
            query = from e in query 
                    where EF.Functions.Like(e.Name, $"%-{username}") // where it ends in ".....-username"
                        || EF.Functions.Like(e.Name, $"{username}-%")  // where it starts with "username-....."
                        || EF.Functions.Like(e.Name, $"-{username}-%")  // for in the future, if we expand to group chat using this same framework (more than 2 users)
                    select e;

            return await query.ToListAsync();

        }

        /// <summary>
        /// Asynchronously get a message from the data context, given the message id.
        /// </summary>
        /// <param name="id">The message id</param>
        public async Task<Message> GetMessage(int id)
        {
            // need the Includes here so that the message returned includes data on the user recipient and sender
            // since that data is linked to the User's table.
            // if we want to get access to the related entities, we either project or eagerly load it.
            return await _context.Messages
                .Include(u => u.Sender)
                .Include(u => u.Recipient)
                .SingleOrDefaultAsync(x => x.Id == id);
        }

        /// <summary>
        /// Asynchronously get a message group, given a group name
        /// </summary>
        /// <param name="groupName">The message group name</param>
        public async Task<Group> GetMessageGroup(string groupName)
        {
            return await _context.Groups
                .Include(x => x.Connections)
                .FirstOrDefaultAsync(x => x.Name == groupName);
        }

        /// <summary>
        /// Asynchronously gets unread message count for a user
        /// </summary>
        /// <param name="groupName">The message group name</param>
        public async Task<int> GetUnreadMessagesCountForUser(string username)
        {
            // Get messages where recipient is the current user, they are not deleted by the user, and the date read is null.
            // Send back the count of those results.
            return await _context.Messages
                .Where(m => m.RecipientUsername == username && m.RecipientDeleted == false && m.DateRead == null)
                .CountAsync();
        }

        /// <summary>
        /// Asynchronously gets messages for a user, given a set of messageParams 
        /// </summary>
        /// <param name="messageParams">The message params, including username and message container</param>
        /// <returns>
        /// A paged list of message dto (messages as a paged list to help with pagination)
        /// </returns>
        public async Task<PagedList<MessageDto>> GetMessagesForUser(MessageParams messageParams)
        {
            var query = _context.Messages
                .OrderByDescending(m => m.MessageSent)
                .ProjectTo<MessageDto>(_mapper.ConfigurationProvider)
                .AsQueryable();

            // only return messages that have not been deleted by that user.
            // So when a user deletes an inbox message, it will still show in the senders inbox
            // Messages are only deleted permanently when both sender and recipient delete it
            query = messageParams.Container switch
            {
                "Inbox" => query.Where(u => u.RecipientUsername == messageParams.Username && u.RecipientDeleted == false),
                "Outbox" => query.Where(u => u.SenderUsername == messageParams.Username && u.SenderDeleted == false),
                _ => query.Where(u => u.RecipientUsername == messageParams.Username && u.RecipientDeleted == false && u.DateRead == null)
            };

            return await PagedList<MessageDto>.CreateAsync(query,messageParams.PageNumber, messageParams.PageSize);
        }

        /*
            TODO: Revisit whether this method is necessary anymore. Functionality has been moved to GetScrolledMessageThread()
        */
        public async Task<IEnumerable<MessageDto>> GetMessageThread(string currentUsername, string recipientUsername)
        {
            // gets the thread of messages between two users.
            var messages = await _context.Messages
                .Include(u => u.Sender).ThenInclude(p => p.Photos)
                .Include(u => u.Recipient).ThenInclude(p => p.Photos)
                .Where(m => m.Recipient.UserName == currentUsername && m.RecipientDeleted == false
                    && m.Sender.UserName == recipientUsername
                    || m.Recipient.UserName == recipientUsername
                    && m.Sender.UserName == currentUsername && m.SenderDeleted == false
                )
                .OrderBy(m => m.MessageSent)
                .ToListAsync();

            // from the list of messages, determine if the current user has unread messages.
            var unreadMessages = messages.Where(m => m.DateRead == null && m.Recipient.UserName == currentUsername).ToList();

            // then mark those unread messages as read
            if (unreadMessages.Any())
            {
                foreach (var message in unreadMessages)
                {
                    message.DateRead = DateTime.UtcNow;
                }
                // save to DB (slight deviation from Unit of Work framework. But need for now if we still want to return a list of MessageDtos)
                // alternative is to have this method return a list of type Message, instead of the  MessageDto.
                await _context.SaveChangesAsync();                
            }

            // return the messageDto
            return _mapper.Map<IEnumerable<MessageDto>>(messages);
        }

        /// <summary>
        /// Primary method to load a set of messages for a message thread. Used withi infinte scrolling
        /// </summary>
        /// <param name="currentUsername">The current user's username</param>
        /// <param name="recipientUsername">The other user's username</param>
        /// <param name="memberChatParams">Params with data for the PagedList settings</param>
        /// <returns>
        ///  A PagedList of messages (used for scrolled apges)
        /// </returns>
        public async Task<IEnumerable<MessageDto>> GetScrolledMessageThread(string currentUsername, string recipientUsername, MemberChatParams memberChatParams)
        {
            // store the query. Filter messagse for these users. Include photos. Order descending by MessageSent date
            var query = _context.Messages
                .Include(u => u.Sender).ThenInclude(p => p.Photos)
                .Include(u => u.Recipient).ThenInclude(p => p.Photos)
                .Where(m => m.Recipient.UserName == currentUsername && m.RecipientDeleted == false
                    && m.Sender.UserName == recipientUsername
                    || m.Recipient.UserName == recipientUsername
                    && m.Sender.UserName == currentUsername && m.SenderDeleted == false
                )
                .OrderByDescending(m => m.MessageSent)
                .AsQueryable();
            

            // from the list of messages, determine if the current user has unread messages.
            var unreadMessages = query.Where(m => m.DateRead == null && m.Recipient.UserName == currentUsername).ToList();
            // then mark those unread messages as read
            if (unreadMessages.Any())
            {
                foreach (var message in unreadMessages)
                {
                    message.DateRead = DateTime.UtcNow;
                }
                // save to DB (slight deviation from Unit of Work framework. But need for now if we still want to return a list of MessageDtos)
                // alternative is to have this method return a list of type Message, instead of the  MessageDto.
                await _context.SaveChangesAsync();                
            }

            return await PagedList<MessageDto>.CreateScrolledAsync(query.ProjectTo<MessageDto>(_mapper.ConfigurationProvider).AsNoTracking(), 
                memberChatParams.PageNumber, memberChatParams.PageSize);
        }

        /// <summary>
        /// Remove a connnection, related to the message group, from the data context.
        /// </summary>
        /// <param name="connection">The connection</param>
        public void RemoveConnection(Connection connection)
        {
            _context.Connections.Remove(connection);
        }
    }
}
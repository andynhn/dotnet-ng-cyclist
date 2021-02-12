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

        public void AddGroup(Group group)
        {
            _context.Groups.Add(group);
        }

        public void AddMessage(Message message)
        {
            _context.Messages.Add(message);
        }

        public void DeleteMessage(Message message)
        {
            _context.Messages.Remove(message);
        }

        public async Task<Connection> GetConnection(string connectionId)
        {
            return await _context.Connections.FindAsync(connectionId);
        }

        public async Task<Group> GetGroupForConnection(string connnectionId)
        {
            return await _context.Groups
                .Include(c => c.Connections)
                .Where(c => c.Connections.Any(x => x.ConnectionId == connnectionId))
                .FirstOrDefaultAsync();
        }

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

        public async Task<Group> GetMessageGroup(string groupName)
        {
            return await _context.Groups
                .Include(x => x.Connections)
                .FirstOrDefaultAsync(x => x.Name == groupName);
        }

        // TO DO: PENDING CLIENT-SIDE INTEGRATION
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
            Get messages for both sides of the convo. Also mark messages that haven't been read and mark as read.
            Get messages in memory, do sth to messages, then map to a Dto.
            We can't use Dto to update DB, so execute request, get them to a list, then work with the messages inside memory here
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

        public void RemoveConnection(Connection connection)
        {
            _context.Connections.Remove(connection);
        }
    }
}
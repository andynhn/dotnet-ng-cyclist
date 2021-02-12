using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Interfaces;
using AutoMapper;
using Microsoft.AspNetCore.SignalR;

namespace API.SignalR
{
    /*
        Signal R Hub for web socket functionality involving Messages.
    */
    /// <summary>
    /// Signal R Hub for web socket functionality involving Messages.
    /// </summary>
    public class MessageHub : Hub
    {
        private readonly IMapper _mapper;
        private readonly IHubContext<PresenceHub> _presenceHub;
        private readonly PresenceTracker _tracker;
        private readonly IUnitOfWork _unitOfWork;
        public MessageHub(IUnitOfWork unitOfWork, IMapper mapper, IHubContext<PresenceHub> presenceHub, PresenceTracker tracker)
        {
            _unitOfWork = unitOfWork;
            _tracker = tracker;
            _presenceHub = presenceHub;
            _mapper = mapper;
        }

        /// <summary>
        /// Performs various critical functionality for sending and receiving messages via Signal R.
        /// Creates a groupname based on the sender and recipient. Combo of usernames, in alphabetical order.
        /// Asynchronously send data to front end that are called in client-side methods
        /// The name of the client-side method must match the string passed through in the "SendAsync()"
        /// </summary>
        public override async Task OnConnectedAsync()
        {
            var httpContext = Context.GetHttpContext();
            // pass in the other user name (via a query string) with the key of user to get it into this variable.
            var otherUser = httpContext.Request.Query["user"].ToString();
            // the group that a pair of users belong to.
            var groupName = GetGroupName(Context.User.GetUsername(), otherUser);
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
            var group = await AddToGroup(groupName);
            await Clients.Group(groupName).SendAsync("UpdatedGroup", group);

            var messages = await _unitOfWork.MessageRepository
                .GetMessageThread(Context.User.GetUsername(), otherUser);

            // check to see if changes in this step. If there are, then save them to the DB here, not within the message repo itself.
            // the unitOfWork class is responsible for saving to DB, not the repository, because we are implementing the unit of work framework.
            if (_unitOfWork.HasChanges()) await _unitOfWork.Complete();

            await Clients.Caller.SendAsync("ReceiveMessageThread", messages);
        }

        /// <summary>
        /// Performs various critical functionality for terminating Signal R connections related to message sending.
        /// Removes the group, sends updatedData to the client, then disconnects the users from Signal R message hub.
        /// </summary>
        public override async Task OnDisconnectedAsync(Exception exception)
        {
            var group = await RemoveFromMessageGroup();
            await Clients.Group(group.Name).SendAsync("UpdatedGroup", group);
            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Method to send a message using the Signal R Hub.
        /// Invoked client-side with 'this.hubConnection.invoke('SendMessage', {recipientUsername: username, content})'
        /// </summary>
        public async Task SendMessage(CreateMessageDto createMessageDto)
        {
            var username = Context.User.GetUsername();

            if (username == createMessageDto.RecipientUsername.ToLower())
                throw new HubException("You cannot send messages to yourself");

            var sender = await _unitOfWork.UserRepository.GetUserByUsernameAsync(username);
            var recipient = await _unitOfWork.UserRepository.GetUserByUsernameAsync(createMessageDto.RecipientUsername);

            if (recipient == null) throw new HubException("Not found user");

            var message = new Message
            {
                Sender = sender,
                Recipient = recipient,
                SenderUsername = sender.UserName,
                RecipientUsername = recipient.UserName,
                Content = createMessageDto.Content
            };

            // get the signal r group name
            var groupName = GetGroupName(sender.UserName, recipient.UserName);

            // get the group from the group name.
            var group = await _unitOfWork.MessageRepository.GetMessageGroup(groupName);

            // if there are any connections in the gruop where the username is the same as the recipient name 
            // (aka, the recipient of the message is connected to the app and logged in, 
            // update the DateRead for that message as well, since they are actively accessing the message)
            if (group.Connections.Any(x => x.Username == recipient.UserName))
            {
                message.DateRead = DateTime.UtcNow;
            }
            else
            {
                // if the user is online but not connected to the same message group hub (somewhere else in the app), 
                // then we want this to eventually send them a notification.
                var connections = await _tracker.GetConnectionsForUser(recipient.UserName);
                if (connections != null)
                {
                    await _presenceHub.Clients.Clients(connections).SendAsync("NewMessageReceived", new {username = sender.UserName, firstName = sender.FirstName});
                }
            }

            _unitOfWork.MessageRepository.AddMessage(message);

            if (await _unitOfWork.Complete())
                await Clients.Group(groupName).SendAsync("NewMessage", _mapper.Map<MessageDto>(message));
        }

        /// <summary>
        /// Method to get a group name, from two usernames, to be used for sending messages via Signal R
        /// </summary>
        private string GetGroupName(string caller, string other)
        {
            // check if caller is shorter than other
            var stringCompare = string.CompareOrdinal(caller, other) < 0;
            // then return the group name as a string with the usernames arranged in alphabetical order...
            return stringCompare ? $"{caller}-{other}" : $"{other}-{caller}";
        }

        /// <summary>
        /// Given a group name, method to add a groupname to a Signal R message hub group.
        /// </summary>
        private async Task<Group> AddToGroup(string groupName)
        {
            // get the group from the group name.
            var group = await _unitOfWork.MessageRepository.GetMessageGroup(groupName);

            // create a connection with the connection id and the currentusername
            var connection = new Connection(Context.ConnectionId, Context.User.GetUsername());

            // if the group is null, or is not already an established message group
            if (group == null)
            {
                // create a new group from the group name, then add it to the repository.
                group = new Group(groupName);
                _unitOfWork.MessageRepository.AddGroup(group);
            }
            // then add the connection to the groups list of connections.
            group.Connections.Add(connection);

            if (await _unitOfWork.Complete()) return group;

            throw new HubException("Failed to join group");
        }

        /// <summary>
        /// Remove a connection from a message hub group, for when a user exits the message hub.
        /// </summary>
        private async Task<Group> RemoveFromMessageGroup()
        {
            // get the group.
            var group = await _unitOfWork.MessageRepository.GetGroupForConnection(Context.ConnectionId);
            // get the connection from the group, using the connection id from the Context.
            var connection = group.Connections.FirstOrDefault(x => x.ConnectionId == Context.ConnectionId);

            // remove the connection.
            _unitOfWork.MessageRepository.RemoveConnection(connection);

            // save
            if (await _unitOfWork.Complete()) return group;

            throw new HubException("Failed to remove from group");
        }
    }
}
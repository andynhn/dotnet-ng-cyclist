using System.Collections.Generic;
using System.Threading.Tasks;
using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Helpers;
using API.Interfaces;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Authorize]
    public class MessagesController : BaseApiController
    {
        private readonly IMapper _mapper;
        private readonly IUnitOfWork _unitOfWork;
        public MessagesController(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        /// <summary>
        /// Asynchronously get's users messages for a user from a given query of message params.
        /// Route: "api/messages"
        /// </summary>
        /// <returns>
        /// List of MessageDTO
        /// </returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MessageDto>>> GetMessagesForUser([FromQuery] MessageParams messageParams)
        {
            messageParams.Username = User.GetUsername();

            var messages = await _unitOfWork.MessageRepository.GetMessagesForUser(messageParams);

            Response.AddPaginationHeader(messages.CurrentPage, messages.PageSize, messages.TotalCount, messages.TotalPages);

            return Ok(messages);
        }

        /// <summary>
        /// Asynchronously get's users unread messages count
        /// Route: "api/messages/unread"
        /// </summary>
        /// <returns>
        /// Count of unread messages
        /// </returns>
        [HttpGet("unread")]
        public async Task<ActionResult<int>> GetUnreadMessagesCountForUser()
        {
            var unreadMessagesCount = await _unitOfWork.MessageRepository.GetUnreadMessagesCountForUser(User.GetUsername());
            return Ok(unreadMessagesCount);
        }

        /// <summary>
        /// HTTP Delete method that asynchronously deletes a message
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteMessage(int id)
        {
            var username = User.GetUsername();

            var message = await _unitOfWork.MessageRepository.GetMessage(id);

            // if message has nothing to do with the logged in user...
            if (message.Sender.UserName != username && message.Recipient.UserName != username)
                return Unauthorized();

            // flag true if the message sender deleted the message
            if (message.Sender.UserName == username)
                message.SenderDeleted = true;

            // flag true if the message recipient deleted the message
            if (message.Recipient.UserName == username)
                message.RecipientDeleted = true;

            // if both the message sender and recipient deleted the message, then delete the message from the database.
            if (message.SenderDeleted && message.RecipientDeleted)
                _unitOfWork.MessageRepository.DeleteMessage(message);

            // We save database changes here.
            if (await _unitOfWork.Complete()) return Ok();

            // if everything fails, return bad request
            return BadRequest("Problem deleting the message");
        }

    }
}
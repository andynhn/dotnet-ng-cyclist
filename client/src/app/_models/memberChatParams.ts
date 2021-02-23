/**
 * Model to help with "scrolled pagination" within member-messages chat box, aka Infinite Scrolling
 */
export class MemberChatParams {
    pageNumber = 1;     // default to 1 to account for the initial page load
    pageSize = 10;      // SCROLLED PAGE SIZE : set to the number of messages to return from the server on each scroll to top.
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { BehaviorSubject, of, ReplaySubject } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Group } from '../_models/group';
import { MemberChatParams } from '../_models/memberChatParams';
import { Message } from '../_models/message';
import { PageParams } from '../_models/pageParams';
import { User } from '../_models/user';
import { LoadingService } from './loading.service';
import { getPaginatedResult, getPaginationHeaders } from './paginationHelper';


@Injectable({
  providedIn: 'root'
})
export class MessageService {
  // ------------API ENVIRONMENT URLS------------------------
  baseUrl = environment.apiUrl;
  hubUrl = environment.hubUrl;

  // ------------VARIABLES THAT HELP WITH PAGINATION WITHIN THE HOME UNREAD/INBOX/OUTBOX PAGE---------------
  pageParams: PageParams;   // facilitate pagination
  onUnread = 0; onInbox = 0; onOutbox = 0;    // facilitate caching wtihin different mail containers by forcing reload on new containers
  messageCache = new Map();  // cache for pagination
  containerModified = false;  // facilitates caching. If a container is modified (message deleted, etc.), refresh the cache.

  // ------------HUB CONNECTION FOR SIGNAL R INTEGRATION-----------
  private hubConnection: HubConnection;

  // ------------BEHAVIOR SUBJECT THAT TRACKS THE MESSAGE THREAD BETWEEN USERS---------
  private messageThreadSource = new BehaviorSubject<Message[]>([]);
  messageThread$ = this.messageThreadSource.asObservable();

  // ------------VARIABLES THAT PRIMARILY AID WITH SCROLLING WITHIN THE MEMBER-MESSAGES COMPONENT--------------
  memberChatParams: MemberChatParams; // facilitates "scrolling pagination" for chat box. Determines "pageSize" and "pageNumber".

  // **PROPERTIES THAT HELP SCROLL TO BOTTOM OF A CHAT BOX ON INITIAL PAGE LOAD
  private messageThreadLoaded = new BehaviorSubject<boolean>(false);  // if message thread has loaded, scroll to bottom of chat box 1x
  messageThreadLoaded$ = this.messageThreadLoaded.asObservable();
  private scrollBottomCount = new BehaviorSubject<number>(0);   // tracks count to only allow scroll bottom to occur 1x on initial load
  scrollBottomCount$ = this.scrollBottomCount.asObservable();

  // **PROPERTIES THAT HELP WITH 'INFINITE SCROLLING UPWARDS' WITHIN A MESSAGE CHAT BOX
  private scrolledPagesCount = new BehaviorSubject<number>(1);  // increments when API call made to load more messages on scroll to top
  scrolledPagesCount$ = this.scrolledPagesCount.asObservable();
  private allMessagesLoadedFlag = new BehaviorSubject<boolean>(false);  // tracks if all messages have been returned (scrolled to very top)
  allMessagesLoadedFlag$ = this.allMessagesLoadedFlag.asObservable();

  // **PROPERTIES THAT HELP WITH AUTO-SCROLL TO BOTTOM OF CHAT BOX WHEN 2 USERS ARE SIMULTANEOUSLY LIVE CHATTING
  private messagesLengthThatRequiresScrolling = new BehaviorSubject<number>(0); // tracks the number of loaded messages for scrolling logic
  messagesLengthThatRequiresScrolling$ = this.messagesLengthThatRequiresScrolling.asObservable();
  hubMessageReceivedFlag: boolean;  // tracks if logged in user received a message while 2 users are live in a chat hub
  mostRecentRecipientUsername: string;  // tracks the username of the recent message sent whiel 2 users are live in a chat hub.

  // **PROPERTIES THAT HELP TRACK UNREAD MESSAGES COUNT FOR DISPLAYING IN THE NAV BAR
  private unreadMessagesCount = new ReplaySubject<number>(1);
  unreadMessages$ = this.unreadMessagesCount.asObservable();

  constructor(private http: HttpClient,
              private loadingService: LoadingService) {
                // initialize certain properties in the constructor
                this.pageParams = new PageParams();
                this.memberChatParams = new MemberChatParams();
                this.resetHubMessageReceivedFlag();
                this.resetMostRecentRecipientUsername();
  }


  // ------------------------------------------------------------------------------------------------------------------------------------
  // -------------------------------METHODS RELATED TO LIVE CHAT AND INTERACTION WITH SIGNAL R SERVER-SIDE-------------------------------
  // ------------------------------------------------------------------------------------------------------------------------------------

  /**
   * Primary angular method for creating hub connections.
   * Interacts with Signal R back-end.
   * methodNames passed in hubConnection methods are directly from the server (spelling matters for method recognition)
   * @param user the logged in user
   * @param otherUsername the other user in the message thread
   */
  createHubConnection(user: User, otherUsername: string) {
    this.loadingService.setToLoading();                 // while hub is starting, start the loading service
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(this.hubUrl + 'message?user=' + otherUsername, {
        accessTokenFactory: () => user.token
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start()                          // promise is returned from .start(), so we can use the loading service here.
      .catch(error => console.log(error))
      .finally(() => this.loadingService.setToIdle());  // turn off loading service after connection has finished starting

    // CALLED SERVER-SIDE WITHIN METHOD THAT CREATES THE CONNECTION. LOADS INITIAL SET OF MESSAGES.
    this.hubConnection.on('ReceiveMessageThread', messages => {   // method name must match server-side method in MessageHub.cs
      if (messages.length < this.memberChatParams.pageSize) { // If returned messages are less than pageSize, all messages have been loaded
        this.allMessagesLoadedFlag.next(true);           // set to true to prevent component 'infinite scrolling' from making more API calls
      } else {
        this.allMessagesLoadedFlag.next(false);  // set to false to continue api calls within 'infinite scrolling'
      }
      this.messageThreadSource.next(messages);           // update the message thread to include the received messages from the server.
      this.messageThreadLoaded.next(true);  // set to true since messages are done loading. Used for auto-scroll bottom in chat on page load
    });

    // CALLED SERVER-SIDE WITHIN METHOD THAT 'GETS MORE MESSAGES' FOR USE WITH INFINITE SCROLLING
    this.hubConnection.on('ReceivedMessageThread', messages => {
      this.messageThread$.pipe(take(1)).subscribe(m => {
        if (messages.length < this.memberChatParams.pageSize) { // If messages < pageSize, all older messages have been loaded
          this.allMessagesLoadedFlag.next(true);  // set to true to prevent component 'infinite scrolling' from making more API calls
        } else {
          this.allMessagesLoadedFlag.next(false);  // set to false to continue api calls within 'infinite scrolling'
        }
        this.messageThreadSource.next([...messages, ...m]);  // append messages to front of thread (order matters for 'reverse' scrolling)
      });
      this.messageThreadLoaded.next(true);  // signal that the message thread from the server has finished loading.
    });

    // CALLED SERVER-SIDE WITHIN 'SEND MESSAGE' IF 2 USERS ARE LIVE IN THE SAME MESSAGE GROUP HUB
    this.hubConnection.on('NewMessage', message => {
      this.messageThread$.pipe(take(1)).subscribe(messages => {
        this.messageThreadSource.next([...messages, message]);  // add the message to the end of the message thread list (order matters)
        this.hubMessageReceivedFlag = true; // set to true to help with scroll bottom logic (auto-scroll or display button to scroll bottom)
        this.mostRecentRecipientUsername = message.recipientUsername; // track who the message recipient is for scrolling logic
        this.messagesLengthThatRequiresScrolling.next(messages.length); // track the length of the current messageThreadSource for scrolling
      });
    });

    // CALLED SERVER-SIDE WITHIN ONCONNECTEDASYNC AND ONDISCONNNECTEDASYNC.
    this.hubConnection.on('UpdatedGroup', (group: Group) => {
      if (group.connections.some(x => x.username === otherUsername)) {
        this.messageThread$.pipe(take(1)).subscribe(messages => {     // if a user enters the chat, mark new received messages as read
          messages.forEach(message => {
            if (!message.dateRead) {
              message.dateRead = new Date(Date.now());
            }
          });
          this.messageThreadSource.next([...messages]);         // update the message thread to include the front-end changes to date read
        });
      }
    });
  }

  /**
   * Asynchronously send a message through the Hub using Signal R server-side.
   * Method invoked in quotes must match spelling of server-side message hub method.
   * @param username the username of the message recipient
   * @param content the content of the message
   */
  async sendMessage(username: string, content: string) {  // async can use await, but it also guarantees that we can return a promise
    return this.hubConnection.invoke('SendMessage',
        {                                                 // method must accept an object that matches the server-side parameters
          recipientUsername: username,
          content
        }
      )
      .catch(error => console.log(error));
  }

  /**
   * Asynchronously displays more messages when user scrolls to the top of the chat box, AKA Infinite Scrolling.
   * Method invoked in quotes must match spelling of server-side message hub method.
   * @param username the username of the other user in the message thread
   */
  async displayMoreMessages(username: string) {
    // console.log(this.memberChatParams.pageSize)
    // console.log(this.memberChatParams.pageNumber)
    return this.hubConnection.invoke('GetMoreMessages',
        {                                                 // method must accept an object that matches the server-side parameters
          recipientUsername: username,
          pageSize: this.memberChatParams.pageSize,
          pageNumber: this.memberChatParams.pageNumber
        }
      )
      .catch(error => console.log(error));
  }

  /**
   * Primary method for stopping the hub connection for messages (when they navigate away from the chat box page).
   * Resets numerous properties used for 'infinite scrolling' and 'auto-scroll bottom' of the chat box.
   * Disconnects user from the message hub.
   */
  stopHubConnection(): void {
    if (this.hubConnection) {                   // if a hub connection exists...
      this.messageThreadSource.next([]);        // clear the message thread observable
      // ----------------RESET PROPERTIES THAT HELP WITH AUTO-SCROLL TO BOTTOM OF CHAT BOX------------------------
      this.resetScrollBottomCount();            // reset property that helps scroll to bottom 1x on chat box load
      this.resetMessageThreadLoadedBoolean();   // rest property that tracks whether a message thread is done loading
      // ----------------RESET PROPERTIES THAT HELP WITH INFINITE SCROLLING CHAT BOX------------------------
      this.resetMemberChatParams();             // reset params that help with 'scrolling pagination'. Provide pageNumber and pageSize.
      this.resetScrolledPagesCount();           // reset property that tracks API calls to load more 'scrolled pages' for infinite scrolling
      this.resetAllMessagesLoadedFlag();        // reset proeprty that signals whether all messages have loaded to stop infinite scrolling.
      this.resetHubMessageReceivedFlag();       // reset property that signals a message receipt while 2 users are live in a chat.
      this.resetMostRecentRecipientUsername();  // reset property that tracks username of recent message while 2 users are in live chat.
      this.hubConnection.stop();                // finally, stop the hub connection
    }
  }

  // -------------------------------GETTERS/SETTERS FOR PROPERTIES RELATED TO MESSAGE HUB LIVE CHAT--------------------------------

  // -----------SET AND RESET MESSAGE THREAD LOADED BOOLEAN---------------
  setMessageThreadLoadedBoolean(value: boolean): void {
    this.messageThreadLoaded.next(value);
  }
  resetMessageThreadLoadedBoolean(): void {
    this.messageThreadLoaded.next(false);
  }
  // -----------------GET, SET, AND RESET SCROLL BOTTOM COUNT-------------------
  setScrollBottomCount(value: number): void {
    this.scrollBottomCount.next(value);
  }
  resetScrollBottomCount(): void {
    this.scrollBottomCount.next(0);
  }
  // -----------------GET, SET, AND RESET SCROLLED PAGES COUNT-------------------
  setScrolledPagesCount(value: number): void {
    this.scrolledPagesCount.next(value); // reset to 1 in order to account for the messages from the initial page load.
  }
  resetScrolledPagesCount(): void {
    this.scrolledPagesCount.next(1); // reset to 1 in order to account for the messages from the initial page load.
  }
  // ----------------GET, SET, AND RESET, ALL MESSAGES LOADED FLAG-----------------
  setAllMessagesLoadedFlag(value: boolean): void {
    this.allMessagesLoadedFlag.next(value);
  }
  resetAllMessagesLoadedFlag(): void {
    this.allMessagesLoadedFlag.next(false); // reset to false because default condition is that no messages have loaded.
  }
  // ----------------GET, SET, AND RESET HUB MESSAGE RECEIVED FLAG----------------
  setHubMessageReceivedFlag(value: boolean): void {
    this.hubMessageReceivedFlag = value;
  }
  resetHubMessageReceivedFlag(): void {
    this.hubMessageReceivedFlag = false;
  }
  // ---------------GET, SET, AND RESET MOST RECIPIENT USERNAME------------------
  setMostRecentRecipientUsername(value: string): void {
    this.mostRecentRecipientUsername = value;
  }
  resetMostRecentRecipientUsername(): void {
    this.mostRecentRecipientUsername = '';  // reset to empty string
  }
  // -------------------GET, SET, AND RESET MEMBER CHAT PAGE PARAMS-------------------
  getMemberChatParams(): MemberChatParams {
    return this.memberChatParams;
  }
  setMemberChatParams(params: MemberChatParams): void {
    this.memberChatParams = params;
  }
  resetMemberChatParams(): void {
    this.memberChatParams = new MemberChatParams(); // reset to new MemberChatParams object, which has default values set in the model.
  }



  // ------------------------------------------------------------------------------------------------------------------------------------
  // -------------------------------METHODS RELATED TO USER'S MESSAGE INBOX/OUTBOX/UNREAD PAGE-------------------------------------------
  // ------------------------------------------------------------------------------------------------------------------------------------


  /**
   * Primary method to access API to return all messages for a user (within the inbox/unread/outbox page)
   * @param pageParams Params that include pageNumber, pageSize, and Container that help with pagination for the inbox/unread/outbox pages
   */
  getMessages(pageParams: PageParams) {
    // -------------LOGIC FOR MESSAGE CONTAINER CACHING-------------------

    /*
      Logic that helps with message caching for different message containers. Goal is to cache only while
      within separate pages of the same container. Reset the cache if they change containers.
      Increment that property of the appropriate container when the user accesses it. Reset the others to 0.
    */
    if (pageParams.container === 'Unread') {
      this.onUnread++; this.onInbox = 0; this.onOutbox = 0;
    } else if (pageParams.container === 'Inbox') {
      this.onUnread = 0; this.onInbox++; this.onOutbox = 0;
    } else if (pageParams.container === 'Outbox') {
      this.onUnread = 0; this.onInbox = 0; this.onOutbox++;
    }

    /*
      Reset the cache if they click a different container, which will be set to 1 from the previous step.
      If they click a new page within the same container, that property will be greater than 1, so this skip this and instead cache.
    */
    if (this.onUnread === 1 && this.onInbox === 0 && this.onOutbox === 0) {
      this.messageCache = new Map();
      this.pageParams.pageNumber = 1;
    } else if (this.onUnread === 0 && this.onInbox === 1 && this.onOutbox === 0) {
      this.messageCache = new Map();
      this.pageParams.pageNumber = 1;
    } else if (this.onUnread === 0 && this.onInbox === 0 && this.onOutbox === 1) {
      this.messageCache = new Map();
      this.pageParams.pageNumber = 1;
    }

    /*
      If the containerModified is true, it means the user has deleted a message in their container.
      So reset the cache in order to maintain pagination functionality.
    */
    if (this.containerModified === true) {
      this.messageCache = new Map();
    }

    /*
      Now, we can proceed with checking the cache. We save a key in the cache map that corresponds to a value of paginated results.
      If the key exists(a hyphen-separated string of values from the PageParams - pageNumber, pageSize, etc.), return the result
      stored in that key in order to skip the API call.
    */
    const response = this.messageCache.get(Object.values(pageParams).join('-'));
    if (response) {
      return of(response); // if response is true, it's in the cache, so skip the API call and instead return that response
    }

    /*
      We make it here if there was no response in the cache.
      The API requires a set of HTTP params that includes a header for pageNumber, pageSize, and page Container (inbox, unread, outbox).
      Since pageNumber and pageSize are integral to pagination, we have a helper method that helps append them to http params.
    */
    let params = getPaginationHeaders(pageParams.pageNumber, pageParams.pageSize);

    // Any custom params specific to a component, like Container, should be appended here.
    params = params.append('container', pageParams.container);

    /*
      With our params set, we can call the API.
      We have a helper method that returns the results as a paginated result and sets the Pagination Headers
    */
    return getPaginatedResult<Message[]>(this.baseUrl + 'messages', params, this.http).pipe(
      map(paginatedResult => {
        this.containerModified = false;
        this.messageCache.set(Object.values(pageParams).join('-'), paginatedResult);
        return paginatedResult;
      })
    );
  }

  /**
   * Direct API request to get a message thread (this is not used with signal R hub).
   * @param username the other user that the current user has a message thread with.
   */
  getMessageThread(username: string) {
    return this.http.get<Message[]>(this.baseUrl + 'messages/thread/' + username);
  }

  /**
   * Primary method for a user to delete a message in their container.
   * @param id the id associated with a message.
   */
  deleteMessage(id: number) {
    this.containerModified = true;  // pagination and caching rely on this. Must force a reset to caching since page has been modified.
    return this.http.delete(this.baseUrl + 'messages/' + id);
  }


  // ----------------------------GETTERS/SETTERS FOR PROPERTIES RELATED TO MESSAGE INBOX/UNREAD/OUTBOX PAGE------------------------------


  // ------GET, SET, AND RESET PAGE PARAMS (FOR THE HOME INBOX/UNREAD/OUTBOX) COMPONENT--------
  getPageParams(): PageParams {
    return this.pageParams;
  }
  setPageParams(params: PageParams): void {
    this.pageParams = params;
  }
  resetPageParams(): void {
    this.pageParams = new PageParams(); // reset to a new PageParams model object that has default values set in the model
    this.onUnread = 0; this.onInbox = 0; this.onOutbox = 0; // reset these to 0
    this.messageCache = new Map();       // reset the messageCache map that helps with caching loaded messages.
  }


  // ------------------------------------------------------------------------------------------------------------------------------------
  // -------------------------------METHODS RELATED TO DISPLAYING AN UNREAD MESSAGES COUNTER IN NAV BAR----------------------------------
  // ------------------------------------------------------------------------------------------------------------------------------------

  /**
   * Primary method to access the API to get the count of unread messages directly
   */
  getUnreadMessagesCountApi() {
    return this.http.get<number>(this.baseUrl + 'messages/unread').pipe(
      map(response => {
        this.unreadMessagesCount.next(response);
        return response;
      })
    );
  }
  getUnreadMessagesCount(): number {
    let count: number;
    this.unreadMessages$.pipe(take(1)).subscribe(initialCount => count = initialCount);
    return count;
  }
  /**
   * Decrement the unread messages counter by 1
   */
  decrementUnreadMessagesCount(): void {
    this.unreadMessages$.pipe(take(1)).subscribe(initialCount => {
      this.unreadMessagesCount.next(initialCount--);
    });
  }
  /**
   * Decrease the unread messages count by a provided value
   */
  decreaseUnreadMessagesCountByValue(value: number): void {
    this.unreadMessages$.pipe(take(1)).subscribe(initialCount => {
      this.unreadMessagesCount.next(initialCount - value);
    });
  }
  /**
   * Increment the unread messages counter by 1
   */
  incrementUnreadMessagesCount(): void {
    this.unreadMessages$.pipe(take(1)).subscribe(initialCount => {
      this.unreadMessagesCount.next(initialCount++);
    });
  }
  /**
   * Increase the unread messages counter by a provided value
   */
  increaseUnreadMessagesCountByValue(value: number): void {
    this.unreadMessages$.pipe(take(1)).subscribe(initialCount => {
      this.unreadMessagesCount.next(initialCount + value);
    });
  }
  /**
   * Exactly set the unread messages counter by a provided value
   */
  setUnreadMessagesCount(value: number): void {
    this.unreadMessagesCount.next(value);
  }
  /**
   * Reset the unread messages counter to 0
   */
  resetUnreadMessagesCount(): void {
    this.unreadMessagesCount.next(null);
  }






  getMessageGroupsByUsername() {
    return this.http.get<[]>(this.baseUrl + 'messages/message-groups').pipe(
      map(response => {
        return response;
      })
    );
  }
}

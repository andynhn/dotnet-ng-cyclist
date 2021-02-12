import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { BehaviorSubject, of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Group } from '../_models/group';
import { Message } from '../_models/message';
import { PageParams } from '../_models/pageParams';
import { User } from '../_models/user';
import { LoadingService } from './loading.service';
import { getPaginatedResult, getPaginationHeaders } from './paginationHelper';


@Injectable({
  providedIn: 'root'
})
export class MessageService {
  baseUrl = environment.apiUrl;
  hubUrl = environment.hubUrl;
  private hubConnection: HubConnection;
  private messageThreadSource = new BehaviorSubject<Message[]>([]);
  messageThread$ = this.messageThreadSource.asObservable();
  pageParams: PageParams;
  messageCache = new Map();  // implement a cache for pagination, etc.
  // properties to help with member caching within containers but forcing reload when navigating to a new container.
  onUnread = 0;
  onInbox = 0;
  onOutbox = 0;
  // property to help with caching. If a container is modified (message deleted, etc.), use logic to refresh the cache.
  containerModified = false;

  constructor(private http: HttpClient, private loadingService: LoadingService) {
    this.pageParams = new PageParams();
  }

  /**
   * Primary angular method for creating hub connections.
   * Interacts with Signal R back-end.
   * methodNames passed in hubConnection methods are directly from the server (spelling matters)
   * @param user the logged in user
   * @param otherUsername the message recipient
   */
  createHubConnection(user: User, otherUsername: string) {
    this.loadingService.setToLoading();
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(this.hubUrl + 'message?user=' + otherUsername, {
        accessTokenFactory: () => user.token
      })
      .withAutomaticReconnect()
      .build();

    // promise is returned from .start(), so we can use the loading service here.
    this.hubConnection.start()
      .catch(error => console.log(error))
      .finally(() => this.loadingService.setToIdle());

    // this name is exactly what we called it in the MesssageHub.cs class
    this.hubConnection.on('ReceiveMessageThread', messages => {
      this.messageThreadSource.next(messages);
    });

    this.hubConnection.on('NewMessage', message => {
      this.messageThread$.pipe(take(1)).subscribe(messages => {
        this.messageThreadSource.next([...messages, message]);
      });
    });

    this.hubConnection.on('UpdatedGroup', (group: Group) => {
      if (group.connections.some(x => x.username === otherUsername)) {
        this.messageThread$.pipe(take(1)).subscribe(messages => {
          messages.forEach(message => {
            if (!message.dateRead) {
              message.dateRead = new Date(Date.now());
            }
          });
          this.messageThreadSource.next([...messages]);
        });
      }
    });

  }

  /**
   * Stop the hub connection for messages, which empties the messageThreadaSource and stops the hub.
   */
  stopHubConnection() {
    // stop the hub connection if it exists.
    if (this.hubConnection) {
      this.messageThreadSource.next([]);  // when we stop the hub connection (they navigate from messages tab), clear this.
      this.hubConnection.stop();
    }
  }

  /**
   * API access to messages
   * @param pageParams Params that include pageNumber, pageSize, and Container for the inbox/unread/outbox
   */
  getMessages(pageParams: PageParams) {
    // goal is to have caching if within the same container. force api call if they switch containers.
    console.log(Object.values(pageParams).join('-'));

    // 3 properties are initialized to 0.
    // if user accesses a container, increment that property and set the others to 0.
    // If a user stays on the container, but clicks a different page of messages, increment and set the others to 0.
    // If a user clicks on a different container, increment that container, but set the others to 0.
    if (pageParams.container === 'Unread') {
      this.onUnread++; this.onInbox = 0; this.onOutbox = 0;
      console.log(`onUnread: ${this.onUnread}, onInbox: ${this.onInbox}, onOutbox: ${this.onOutbox}`);
    } else if (pageParams.container === 'Inbox') {
      this.onUnread = 0; this.onInbox++; this.onOutbox = 0;
      console.log(`onUnread: ${this.onUnread}, onInbox: ${this.onInbox}, onOutbox: ${this.onOutbox}`);
    } else if (pageParams.container === 'Outbox') {
      this.onUnread = 0; this.onInbox = 0; this.onOutbox++;
      console.log(`onUnread: ${this.onUnread}, onInbox: ${this.onInbox}, onOutbox: ${this.onOutbox}`);
    }

    // Now, we want to reset the cache if they click a different container.
    // If any of the below properties is 1 while the rest are 0, they have clicked that container.
    // If they click a different page on the same container, that property will be greater than 1, so skip this logic.
    // and instead proceed with caching.
    if (this.onUnread === 1 && this.onInbox === 0 && this.onOutbox === 0) {
      this.messageCache = new Map();
      this.pageParams.pageNumber = 1;
      console.log(`onUnread: ${this.onUnread}, onInbox: ${this.onInbox}, onOutbox: ${this.onOutbox}`);
    } else if (this.onUnread === 0 && this.onInbox === 1 && this.onOutbox === 0) {
      this.messageCache = new Map();
      this.pageParams.pageNumber = 1;
      console.log(`onUnread: ${this.onUnread}, onInbox: ${this.onInbox}, onOutbox: ${this.onOutbox}`);
    } else if (this.onUnread === 0 && this.onInbox === 0 && this.onOutbox === 1) {
      this.messageCache = new Map();
      this.pageParams.pageNumber = 1;
      console.log(`onUnread: ${this.onUnread}, onInbox: ${this.onInbox}, onOutbox: ${this.onOutbox}`);
    }

    if (this.containerModified === true) {
      // then a mesesage was deleted so don't rely on cache. Refresh everything.
      this.messageCache = new Map();
    }

    // Now, proceed with checking the cache. The above logic makes sure that we only cache container messages
    // if they stay on the same container. if they click a different container, refresh the cache.
    // e.g. With current code, always makes sure to get fresh messages when visiting different containers,
    // but will use the message cache if within the same container, unless they refresh the page.
    const response = this.messageCache.get(Object.values(pageParams).join('-'));

    // if response is true, it's in the cache, so return that response.
    if (response) {
      return of(response);
    }

    // if response is false, proceed with getting messages for those set of page params.
    let params = getPaginationHeaders(pageParams.pageNumber, pageParams.pageSize);

    params = params.append('container', pageParams.container);

    // console.log(params);

    return getPaginatedResult<Message[]>(this.baseUrl + 'messages', params, this.http).pipe(
      map(paginatedResult => {
        this.containerModified = false;
        this.messageCache.set(Object.values(pageParams).join('-'), paginatedResult);
        return paginatedResult;
      })
    );
  }

  /**
   * API access to message threads.
   */
  getMessageThread(username: string) {
    return this.http.get<Message[]>(this.baseUrl + 'messages/thread/' + username);
  }

  /**
   * Send a message through the Hub using Signal R server-side.
   * Must invoke server side method "SendMessage"
   */
  async sendMessage(username: string, content: string) {
    // sendMessage no longer makes an api call here, we instead use our hubConnection.
    // "SendMessage must match spelling of method in MessageHub"
    // async can use await, but it also guarantees that we can return a promise
    return this.hubConnection.invoke('SendMessage', {recipientUsername: username, content})
      .catch(error => console.log(error));
  }

  /**
   * delete a message, given the message id.
   * @param id the id associated with a message.
   */
  deleteMessage(id: number) {
    // set the containerModified variable to true so that we force the getMessages() method to bypass caching
    // bypassing caching here allows for pagination to be correctly populated with the accurate number of messages
    this.containerModified = true;
    return this.http.delete(this.baseUrl + 'messages/' + id);
  }



  getPageParams() {
    return this.pageParams;
  }

  setPageParams(params: PageParams) {
    this.pageParams = params;
  }

  resetPageParams() {
    this.pageParams = new PageParams();
    this.onUnread = 0; this.onInbox = 0; this.onOutbox = 0;
    this.messageCache = new Map();
  }
}

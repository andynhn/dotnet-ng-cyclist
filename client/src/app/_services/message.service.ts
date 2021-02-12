import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
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
    let params = getPaginationHeaders(pageParams.pageNumber, pageParams.pageSize);
    params = params.append('Container', pageParams.container);
    return getPaginatedResult<Message[]>(this.baseUrl + 'messages', params, this.http);
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
    return this.pageParams;
  }
}

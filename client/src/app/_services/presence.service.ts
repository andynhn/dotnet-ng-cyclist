import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { User } from '../_models/user';

@Injectable({
  providedIn: 'root'
})
export class PresenceService {
  hubUrl = environment.hubUrl;
  private hubConnection: HubConnection;
  private onlineUsersSource = new BehaviorSubject<string[]>([]);
  onlineUsers$ = this.onlineUsersSource.asObservable();

  constructor(private toastr: ToastrService, private router: Router) { }

  /**
   * Method to create a hub connecction for tarcking user presence.
   * Pass the user because we need to send up our JSON web token when we make this connection.
   * Cannot use the JWT interceptor because Signal R is different from http requests.
   * Typically they'll be using web sockets which does not have support for an authentication header.
   * methodNames passed in hubConnection methods are directly from the server (spelling matters)
   * @param user the logged in user.
   */
  createHubConnection(user: User) {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(this.hubUrl + 'presence', {
        accessTokenFactory: () => user.token
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .catch(error => console.log(error));

    this.hubConnection.on('UserIsOnline', username => {
      this.onlineUsers$.pipe(take(1)).subscribe(usernames => {
        this.onlineUsersSource.next([...usernames, username]);
      });
    });

    this.hubConnection.on('UserIsOffline', username => {
      this.onlineUsers$.pipe(take(1)).subscribe(usernames => {
        this.onlineUsersSource.next([...usernames.filter(x => x !== username)]);
      });
    });

    this.hubConnection.on('GetOnlineUsers', (usernames: string[]) => {
      this.onlineUsersSource.next(usernames);
    });

    this.hubConnection.on('NewMessageReceived', ({username, firstName}) => {
      // display notification when you receive a message but are not connected to a message hub.
      // on tap, go to that user's profile and message thread to see the message.
      const sender = firstName;
      this.toastr.info(sender.charAt(0).toUpperCase() + sender.toLowerCase().slice(1) + ' has sent you a new message!')
        .onTap
        .pipe(take(1))
        .subscribe(() => {
          if (this.router.url === `/members/${username}?tab=3`) {
            /**
             * need this check because angular tends to reuse routes.
             * if user navigated to tab 3 url previously and then clicked on a different tab on that component,
             * Angular will reuse the route and it might not navigate to where we want it to go.
             * So If that's the case, set router.navigated to false so that it forces angular
             * to navigate to the url, even if the the current url is the same (which can happen when using
             * tabsets where you click on separate tabs but the URL does not change)
             */
            this.router.navigated = false;
          }
          this.router.navigateByUrl('/members/' + username + '?tab=3');
        });
    });
  }

  /**
   * Terminate the presence hub connection. This will be typically called on logout.
   */
  stopHubConnection() {
    this.hubConnection.stop().catch(error => console.log(error));
  }
}

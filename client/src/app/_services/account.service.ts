import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { User } from '../_models/user';
import { MessageService } from './message.service';
import { PresenceService } from './presence.service';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  // stores our API url based on environment config.
  baseUrl = environment.apiUrl;

  // Store the current logged in user as an observable that we can access throughout our app.
  // APP CONSISTENTLY ACCESSES THIS OBSERVABLE.
  private currentUserSource = new ReplaySubject<User>(1);
  currentUser$ = this.currentUserSource.asObservable();

  constructor(private http: HttpClient, private presence: PresenceService, private messageService: MessageService) { }

  /**
   * Primary method for logging in users.
   * Once authenticated by the API, this is where we call a method to save the user's
   * credentials (including the JWT) into local storage for quick access
   * throughout our app. This is where we also initially set the currentUserSource observable (which stores useful user info)
   * so that the rest of the Angular app can easily access the info.
   * The Loading Interceptor will use the token saved in the currentUser observable to populate an Authorization header
   * Bearer that has the current user's JWT.
   * @param model Model object received from the login form
   */
  login(model: any) {
    // 1. make an API call to the login controller, which is an observable.
    return this.http.post(this.baseUrl + 'account/login', model).pipe(
      // 2. map the response from the observable. Should return a UserDto, which we've defined in a model as a User type.
      map((response: User) => {
        // the UserDto response from the controller includes the JWT. Set that as a user variable.
        const user = response;

        // 3. if we get an authenticated user back fro the API...
        if (user) {
          // call this method to save useful information in local storage for future access/authorization
          this.setCurrentUser(user);
          this.presence.createHubConnection(user);
        }
      })
    );
  }

  /**
   * Primary method for registering users.
   * Once authenticated by the API, this is where we call a method to save the user's
   * credentials (including the JWT) into local storage for quick access
   * throughout our app. This is where we also initially set the currentUserSource observable (which stores useful user info)
   * so that the rest of the Angular app can easily access the info.
   * The Loading Interceptor will use the token saved in the currentUser observable to populate an Authorization header
   * Bearer that has the current user's JWT.
   * @param model Model object received from the registration form
   */
  register(model: any) {
    return this.http.post(this.baseUrl + 'account/register', model).pipe(
      map((user: User) => {
        if (user) {
          this.setCurrentUser(user);
          this.presence.createHubConnection(user);
        }
      })
    );
  }

  /**
   * Method that sets the jwt and other useful information in localStorage as the 'user' item.
   * Updates the currentUser$ observable to point to the new user so that we can access this info throughout the app.
   * @param user the user object returned from the API.
   */
  setCurrentUser(user: User) {
    // the 'roles' property is stored in the JWT payload returned from the api. Decode that payload in order to populate the object.
    user.roles = [];

    // Decode the JWT. Returns a JSON Object, so access the 'role' property
    const roles = this.getDecodedToken(user.token).role;

    // A JWT payload holds multiple roles as an array and single roles as a string.
    // ...if roles is an array, set the user's roles property.
    // ...if roles is not an array, push the string into our initialized array.
    Array.isArray(roles) ? user.roles = roles : user.roles.push(roles);

    // Finally, save the user object, now with roles data, in local storage to help with authorization throughout the app.
    localStorage.setItem('user', JSON.stringify(user));

    // Then update the currentUserSource observable so that is has the latest User information
    this.currentUserSource.next(user);

  }

  /**
   * Method that decodes a given JWT.
   * @param user the JSON Web Token received from the API.
   */
  getDecodedToken(token): any {
    // JWT is a string separated by ".".
    // decode with atob method. Then split it at the "."
    // Then get the payload which is at index 1.
    // Then return the JSON String as a JSON Object.
    return JSON.parse(atob(token.split('.')[1]));
  }



  /**
   * Logout by deleting the user item in local storage that contains the jwt and other user data.
   * Update the currentUser$ observable to point to null.
   */
  logout() {
    localStorage.removeItem('user');
    this.messageService.resetPageParams();  // destroy the messages cache for the inbox/outbox/unread tab.
    this.currentUserSource.next(null);
    this.presence.stopHubConnection();
    // signalR auto disconnnects user from hub when user closes browser, moves to another website, etc.
    // but we need to stop it manually when they log out.

    // TODO: implement force refresh after logout and navigation to root.
  }
}

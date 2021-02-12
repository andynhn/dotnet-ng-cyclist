import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { delay } from 'rxjs/operators';
import { User } from './_models/user';
import { AccountService } from './_services/account.service';
import { LoadingService } from './_services/loading.service';
import { PresenceService } from './_services/presence.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Saddle Up Cyclists';
  isLoading: boolean;

  // Inject the account service, which is a singleton.
  constructor(private http: HttpClient, private accountService: AccountService,
              private loadingService: LoadingService,
              private presence: PresenceService) {}

  ngOnInit(): void {
    this.setCurrentUser();
    this.listenToLoading();
  }

  /**
   * Using information saved in local storage after login/register,
   * this method accesses the AccountService to set the current user, if one exists.
   */
  setCurrentUser() {
    const user: User = JSON.parse(localStorage.getItem('user'));
    if (user) {
      this.accountService.setCurrentUser(user);
      this.presence.createHubConnection(user);
    } else {
      console.log(`Welcome!`);
    }
  }

  listenToLoading(): void {
    this.loadingService.loadingSpinner
      .pipe(delay(0)) // temporarily prevents an 'ExpressionChangedAfterItHasBeenCheckedError' for subsequent requests
      .subscribe((response) => {
        this.isLoading = response;
      });
  }

}

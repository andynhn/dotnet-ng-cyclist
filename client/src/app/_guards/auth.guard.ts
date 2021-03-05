import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AccountService } from '../_services/account.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private accountService: AccountService, private toastr: ToastrService) {}

  /**
   * Auth guard for non-public components. Make sure to specify which routes/components use this in app-routing.module.ts
   */
  canActivate(): Observable<boolean> {
    // if there is a user in the currentUser observable, let them in. This user is set during login/register...
    return this.accountService.currentUser$.pipe(
      map(user => {
        /*
          On login/register, we set the current user in account.service.ts within setCurrentUser(user)...
          We decode the JWT given from the server, which includes roles that we assigned server-side in the payload.
          Then we save the user variable into local storage as a key-value pair with a key called 'user'
          And we also set the currentUser$ observable to this user.
          The below check will make sure that only authorized users are allowed in. We set this auth guard within app-routing.module.ts
          on protected routes.
        */
        if (user) {
          return true;
        }
        // otherwise, flash an error
        this.toastr.error('YOU SHALL NOT PASS!');
      })
    );

  }
}

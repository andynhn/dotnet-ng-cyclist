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
    // if there is a user in the currentUser observable, let them in.
    return this.accountService.currentUser$.pipe(
      map(user => {
        if (user) {
          return true;
        }
        // otherwise, flash an error
        this.toastr.error('YOU SHALL NOT PASS!');
      })
    );

  }
}

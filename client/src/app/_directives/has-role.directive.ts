import { Directive, Input, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { take } from 'rxjs/operators';
import { User } from '../_models/user';
import { AccountService } from '../_services/account.service';

@Directive({
  selector: '[appHasRole]'  // *appHasRole='["Admin"]'
})
export class HasRoleDirective implements OnInit {
  @Input() appHasRole: string[];
  user: User;

  /*
    This custom role directive will help us hide/display DOM elements depending on whether the user is in a specific role.
    This is used throughout the app. For example, to hide/display the Admin panel for Admins.
    Make sure to declare this custom directive "HasRoleDirective" in app.module.ts.
  */
  constructor(private viewContainerRef: ViewContainerRef, private templateRef: TemplateRef<any>, private accountService: AccountService) {
    this.accountService.currentUser$.pipe(take(1)).subscribe( user => {
      this.user = user;
    });
  }
  ngOnInit(): void {
    // clear the view if no roles or if no user exists.
    if (!this.user?.roles || this.user == null) {
      this.viewContainerRef.clear();
      return;
    }

    /*
      Wherever the custom structural directive is used in the HTML DOM,
      if the user has a role in the list provided (e.g.: *appHasRole='["Admin", "Moderator"]'), they can view that DOM element
      These roles are given to the user initially on register via the server seending a JWT.
    */
    if (this.user?.roles.some(r => this.appHasRole.includes(r))) {
      this.viewContainerRef.createEmbeddedView(this.templateRef);
    } else {
      // otherwise, remove that element (e.g. Admin nav bar link) from the DOM.
      this.viewContainerRef.clear();
    }
  }

}

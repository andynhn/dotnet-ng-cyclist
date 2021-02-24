import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AccountService } from '../_services/account.service';
import { MessageService } from '../_services/message.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit {
  model: any = {};

  // make accountService PUBLIC so that we can use it within our nav.component.html file
  // we want to access the currentUser$ observable from our accountService inside our nav.component.html file to make use of the async pipe
  constructor(public accountService: AccountService,
              private router: Router,
              private toastr: ToastrService,
              public messageService: MessageService) { }

  ngOnInit(): void {
  }

  login() {
    // access the login() method in the account service, passing in the loginDto model.
    this.accountService.login(this.model).subscribe(response => {
      // after login, navigate to the home page
      this.router.navigateByUrl('/home');
    });
  }

  logout() {
    // logout() method deletes 'user' item in local storage and sets currentUser observable to null.
    this.accountService.logout();
    // navigate back to the root route.
    this.router.navigateByUrl('/');
  }
}

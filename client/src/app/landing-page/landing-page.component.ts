import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { User } from '../_models/user';
import { AccountService } from '../_services/account.service';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit {
  registerMode = false;
  customizeMode = false;
  discoverMode = false;
  chatMode = false;
  user: User;

  constructor(private accountService: AccountService, private router: Router) {
    this.accountService.currentUser$.pipe(take(1)).subscribe(user => this.user = user);
  }

  ngOnInit(): void {
    // Do not display landing page to logged in users. This hides the register component as well.
    // Instead, navigate authenticated users back to the home component.
    if (this.user) {
      this.router.navigateByUrl('/home');
    }
  }

  registerToggle(): void {
    this.registerMode = !this.registerMode;
  }
  cancelRegisterMode(event: boolean): void {
    this.registerMode = event;
  }


  customizeToggle(): void {
    this.customizeMode = !this.customizeMode;
  }
  cancelCustomizeMode(event: boolean): void {
    this.customizeMode = event;
  }
  cancelCustomizeModeLoadDiscover(event: boolean): void {
    this.customizeMode = event;
    this.discoverMode = !this.discoverMode;
  }


  discoverToggle(): void {
    this.discoverMode = !this.discoverMode;
  }
  cancelDiscoverMode(event: boolean): void {
    this.discoverMode = event;
  }
  cancelDiscoverModeLoadChat(event: boolean): void {
    this.discoverMode = event;
    this.chatMode = !this.chatMode;
  }
  cancelDiscoverModeLoadCustomize(event: boolean): void {
    this.discoverMode = event;
    this.customizeMode = !this.customizeMode;
  }


  chatToggle(): void {
    this.chatMode = !this.chatMode;
  }
  cancelChatMode(event: boolean): void {
    this.chatMode = event;
  }
  cancelChatModeLoadRegister(event: boolean): void {
    this.chatMode = event;
    this.registerMode = !this.registerMode;
  }
  cancelChatModeLoadDiscover(event: boolean): void {
    this.chatMode = event;
    this.discoverMode = !this.discoverMode;
  }

}

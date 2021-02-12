import { ChangeDetectionStrategy, Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { take } from 'rxjs/operators';
import { Message } from 'src/app/_models/message';
import { User } from 'src/app/_models/user';
import { AccountService } from 'src/app/_services/account.service';
import { MessageService } from 'src/app/_services/message.service';

@Component({
  // in order to have a scrolling property in the component and not have console errors, need to set this to OnPush.
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-member-messages',
  templateUrl: './member-messages.component.html',
  styleUrls: ['./member-messages.component.css']
})
export class MemberMessagesComponent implements OnInit {
  @ViewChild('messageForm') messageForm: NgForm;
  @Input() messages: Message[];
  // need username for conditional that displays read/unread. Only display if sender is not the logged in user
  @Input() username: string;
  messageContent: string; // make sure the name of the input in the form is the same
  loading = false;
  // user is needed for conditional in html that aligns the current user's messages to the right and the profile's messages to the left
  user: User;

  constructor(public messageService: MessageService, public accountService: AccountService) {
    this.accountService.currentUser$.pipe(take(1)).subscribe(user => this.user = user);
   }

  ngOnInit(): void {}

  sendMessage() {
    // custom loading here because Signal R does not use HTTP, so our loading interceptor does not handle the delay
    // and we want to makes ure the send button gets disabled/shows loading after it sends the message for a bit
    // use this in the html to disable send message button if loading is true.
    this.loading = true;
    // here, this.username is the username of the profile the logged in user is on.
    // sendMessage takes the recipient, then the messageContent.
    this.messageService.sendMessage(this.username, this.messageContent).then(() => {
      this.messageForm.reset();
    }).finally(() => this.loading = false);
  }
}

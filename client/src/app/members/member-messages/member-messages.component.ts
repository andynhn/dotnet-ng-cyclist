import { AfterViewChecked, ChangeDetectionStrategy, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { TabDirective, TabsetComponent } from 'ngx-bootstrap/tabs';
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
export class MemberMessagesComponent implements OnInit, AfterViewChecked {
  @ViewChild('messageForm') messageForm: NgForm;
  @Input() messages: Message[];
  // need username for conditional that displays read/unread. Only display if sender is not the logged in user
  @Input() username: string;
  messageContent: string; // make sure the name of the input in the form is the same
  loading = false;
  // user is needed for conditional in html that aligns the current user's messages to the right and the profile's messages to the left
  user: User;
  // need access to #scrollMe for logic that auto scrolls to bottom when initially accessing "Messages" tab.
  @ViewChild('scrollMe') private myScrollContainer: ElementRef;
  messageThreadLoaded: boolean;
  scrollBottomCount: number;
  @Input() activeTabC: TabDirective;

  constructor(public messageService: MessageService, public accountService: AccountService) {
    this.accountService.currentUser$.pipe(take(1)).subscribe(user => this.user = user);
    // should return a boolean that indicates whether the message thread has been received from server.
    this.messageService.messageThreadLoaded$.pipe(take(1)).subscribe(m => this.messageThreadLoaded = m);
    this.messageService.scrollBottomCount$.pipe(take(1)).subscribe(s => this.scrollBottomCount = s);
   }

   /**
    * This logic allows for auto-scroll to bottom each time the "Messages" tab is accessed.
    */
  ngAfterViewChecked(): void {
    // "activeTabC" is set to the "activeTab" passed from the parent component. It's "undefined" on initial load (to About page).
    if (this.activeTabC) {
      // If not on the "Messages" tab, set the "scrollBottomCount" to 0. It's redudant if the component is just initalized,
      // but needed if user navigates to tabs within the component. Manually set to 0 when they move to a different tab from "Messages".
      if (this.activeTabC.heading !== 'Messages' && this.scrollBottomCount !== 0) {
        this.scrollBottomCount = 0;
      }
      // If we click on the messages tab from the member-detail component or from the member-card component, "heading" will be "Messages"
      // and "scrollBottomCount" will be 0. Ensures that we run this each time we visit the Messages tab, no matter where we access the tab.
      if (this.activeTabC.heading === 'Messages' && this.scrollBottomCount === 0) {
        console.log('On messages tab. Scrolling to bottom');
        this.scrollToBottom();
      }
    }
  }

  scrollToBottom(): void {
    // Even if we reach this point, we need to see if the messages have been returned from the asynchronous hub invocation
    // from within "createHubConnection()". The "messageThreadLoaded$" observable is set to TRUE in that method after it's done.
    this.messageService.messageThreadLoaded$.pipe(take(1)).subscribe(m => this.messageThreadLoaded = m);
    // Check if "messageThreadLoaded$" is TRUE. If FALSE, the messages are not loaded, so exit out.
    if (this.messageThreadLoaded === true) {
      // Eventually we'll hit this code block, no matter how long it takes for the messages to come back from the hub.
      // This does the scrolling...
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      // Finally, increment "scrollBottomCount" to prevent subsequent invocation within ngAfterViewChecked() while within the "Messages" tab
      this.scrollBottomCount++;

      console.log(`this.scrollBottomCount AFTER SCROLL: ${this.scrollBottomCount}`)
      console.log(`this.messageThreadloaded AFTER SCROLL: ${this.messageThreadLoaded}`)
      // NOTE: the message container will always scroll to bottom when typing messages or sending messages
      // due to settings placed within the HTML tag. This code is only to force scrolling when navigating to the tab.
    }
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

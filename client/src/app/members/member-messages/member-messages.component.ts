import { AfterViewChecked, ChangeDetectionStrategy, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { TabDirective, TabsetComponent } from 'ngx-bootstrap/tabs';
import { ToastrService } from 'ngx-toastr';
import { take } from 'rxjs/operators';
import { MemberChatParams } from 'src/app/_models/memberChatParams';
import { Message } from 'src/app/_models/message';
import { User } from 'src/app/_models/user';
import { AccountService } from 'src/app/_services/account.service';
import { LoadingService } from 'src/app/_services/loading.service';
import { MessageService } from 'src/app/_services/message.service';

@Component({
  // in order to have a scrolling property in the component and not have console errors, need to set this to OnPush.
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-member-messages',
  templateUrl: './member-messages.component.html',
  styleUrls: ['./member-messages.component.css']
})
export class MemberMessagesComponent implements OnInit, AfterViewChecked {
  // @Input() messages: Message[];
  @ViewChild('messageForm') messageForm: NgForm;  // the message form for sending messages in the chat box
  @ViewChild('scrollMe') private myScrollContainer: ElementRef;  // for #scrolMe chat box div in HTML. Need access for scrolling logic.
  @Input() username: string;  // need username for conditional that displays read/unread. Only display if sender is not the logged in user.
  @Input() activeTabC: TabDirective;      // Since this component is a tab within the member-detail component, need access to this Tab Name.

  user: User;         // needed for conditional that aligns user's messages to the right and the profile's messages to the left of chat box
  loading = false;    // boolean to help toggle display in component based on whether data is being loaded.
  messageContent: string; // make sure the name of the input in the form is the same
  memberChatParams: MemberChatParams;     // aid in "scrolled pagination" of chat box, aka Infinite Scrolling
  scrollTopCount: number;                 // tracks similarly named variable from the messageService
  scrolledPagesCount: number;             // tracks similarly named variable from the messageService
  allMessagesLoadedFlag: boolean;         // tracks similarly named variable from the messageService
  messageThreadLoaded: boolean;           // tracks similarly named variable from the messageService. Are messages loaded?
  scrollBottomCount: number;              // tracks similarly named variable from the messageService. Scrolled to bottom on page load?

  constructor(public messageService: MessageService,
              public accountService: AccountService,
              private loadingService: LoadingService,
              private toastr: ToastrService)
  {
    // We need to initialize some component variables in the constructor. Set them to the variables from the service.
                this.accountService.currentUser$.pipe(take(1)).subscribe(user => this.user = user);
                this.messageService.messageThreadLoaded$.pipe(take(1)).subscribe(m => this.messageThreadLoaded = m);
                this.messageService.scrollTopCount$.pipe(take(1)).subscribe(s => this.scrollTopCount = s);
                this.messageService.scrolledPagesCount$.pipe(take(1)).subscribe(s => this.scrolledPagesCount = s);
                this.messageService.allMessagesLoadedFlag$.pipe(take(1)).subscribe(b => this.allMessagesLoadedFlag = b);
                this.messageService.scrollBottomCount$.pipe(take(1)).subscribe(s => this.scrollBottomCount = s);
                this.memberChatParams = this.messageService.getMemberChatParams();
   }

  ngOnInit(): void {}

   /**
    * Logic within ngfterViewChecked is for auto-scroll to bottom when accessing "Messages" tab or while chatting live.
    */
  ngAfterViewChecked(): void {
    // "activeTabC" is set to the "activeTab" passed from the parent component. It's "undefined" on initial load (default to About page).
    if (this.activeTabC) {
      /*
        If not on the "Messages" tab, set "scrollBottomCount" to 0.
        Although redudant if the component is just initalized, it's needed if the user navigates to tabs within the parent component.
      */
      if (this.activeTabC.heading !== 'Messages' && this.scrollBottomCount !== 0) {
        this.scrollBottomCount = 0;
      }
      /*
        If we click on the messages tab (from the member-detail or member-card component) "heading" will be "Messages" and
        "scrollBottomCount" will be 0. This ensures that we run this each time we visit the Messages tab, no matter where we access the tab.
      */
      if (this.activeTabC.heading === 'Messages' && this.scrollBottomCount === 0) {
        console.log('On messages tab. Scrolling to bottom');
        this.scrollToBottom();
      }
      /*
        This facilitates the auto-scroll feature in the chat box.
        If the recipient of the new message sent is the current user, we'll do some logic to see whether to:
        ...1) auto scroll to bottom (if they are scrolled 'near' the bottom of the chat box)
        ...or 2) display a button notifying them of new messages within the thread that they can click to scroll to bottom.
      */
      if (this.activeTabC.heading === 'Messages'
        && this.messageService.hubMessageReceivedFlag === true
        && this.messageService.mostRecentRecipientUsername === this.user.username) { // only if the logged in user is the message recipient.
        console.log(this.messageService.hubMessageReceivedFlag);
        console.log(`${this.myScrollContainer.nativeElement.scrollTop}`);
        console.log(`${this.myScrollContainer.nativeElement.scrollHeight}`);

        // TODO: Revisit whether this ratio (0.3) is appropriate for this condition
        if ((this.myScrollContainer.nativeElement.scrollTop / this.myScrollContainer.nativeElement.scrollHeight) > 0.3) {
          /*
            If user is close enough to the bottom of the scroll container, auto scroll them to the bottom of the chat box.
            This improves functionality when users are "live chatting" (both users on each other's pages at the exact same time).
            Messages load and display appropriately, in real time, at the bottom of the chat box.
          */
          this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
        } else {
          /*
            Otherwise, the user is positioned relatively high up in the chat history scroll box,
            so do not auto scroll to bottom. Display a button that they can click to scroll to bottom instead.
          */
          this.toastr.info('You have new messages in this chat.', 'Click to view new messages')
            .onTap
            .pipe(take(1))
            .subscribe(() => {
              this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
            });
        }

        // need to reset these properties insde the service.
        this.messageService.resetHubMessageReceivedFlag();
        this.messageService.resetMostRecentRecipientUsername();
      }
    }
  }

  /**
   * Primary method for tracking the HTML "scroll" event within the message chat box
   */
  onScroll(event) {
    /*
      Check if scrollBottomCount > 0 in order to skip the initial page load when the scroll is at the top momentarily before
      our logic that auto-scrolls down to bottom of chat thread.
      Check if scrollTop is within the range. User is near the top of their scroll container if within this range.
    */
    if (this.scrollBottomCount > 0 && this.myScrollContainer.nativeElement.scrollTop < 25) {
      console.log('SCROLL TOP');
      this.scrollTopCount++;                // increment scrollTopCount, which could be incremented a few times within this range.
      if (this.scrollTopCount === 1) {      // Since it can increment a few times, we only want to take the first count
        this.messageService.allMessagesLoadedFlag$.pipe(take(1)).subscribe(b => {
          this.allMessagesLoadedFlag = b;   // access this flag from the member service
          console.log(`ALL MESSAGES LOADED?: ${this.allMessagesLoadedFlag}`);
          /*
             If false, we can return more messages from the server on scroll.
             if true, we've reached the top of their scroll box. Stop infinite scrolling.
          */
          if (this.allMessagesLoadedFlag === false) {
            this.displayMoreMessages();
          }
        });
      }
    }
  }

  /**
   * Primary method to display more messages for "Infinite Scrolling" of message chat box
   */
  displayMoreMessages(): void {
    console.log(`${this.myScrollContainer.nativeElement.scrollTop}`);
    console.log(`${this.myScrollContainer.nativeElement.scrollHeight}`);
    this.scrolledPagesCount++;  // tracks how many times we've reached this method to load more messages. Reflects the "pageNumber".
    this.memberChatParams.pageNumber = this.scrolledPagesCount;   // since it reflects the pageNumber, set the chat params property.
    const oldPosition = this.myScrollContainer.nativeElement.scrollTop; // store the "old" position to return their after message load.
    this.loadingService.setToLoading();                                 // activate our loading service indicator.
    setTimeout(() => {                                                  // Want a slight delay to indicate that messages are being fetched.
      this.messageService.setMemberChatParams(this.memberChatParams);   // set the params in the service. Used in method to get messages.
      this.messageService.displayMoreMessages(this.username).then(() => {   // Access Async service method. It returns a promise.
        this.messageService.allMessagesLoadedFlag$.pipe(take(1)).subscribe(b => this.allMessagesLoadedFlag = b);
        this.myScrollContainer.nativeElement.scrollTop = oldPosition;   // return user to position of where they left off in message thread
      }).finally(() => {
        this.loadingService.setToIdle();                          // turn off our loading indicator
        this.scrollTopCount = 0;                                  // reset so that when the user scrolls again, more messages load.
        this.messageService.resetScrollTopCount();
      });
    }, 500);        // set the delay time.
  }

  /**
   * Primary method for auto-scrolling chat box to the bottom (near most recent messages) under specific conditions.
   * Accessed within ngAfterViewChecked, so we have some conditions in place before it proceeds with logic.
   * This method only gets called if: this.activeTabC.heading === 'Messages' && this.scrollBottomCount === 0.
   * Note that we increment this.scrollBottomCount within the method to prevent this from continuously getting invoked.
   */
  scrollToBottom(): void {
    /*
      First, we need to see if the messages have been returned from the asynchronous message hub invocation from within the message
      service method "createHubConnection()". The "messageThreadLoaded$" observable is set to TRUE in that method after it's done.
    */
    this.messageService.messageThreadLoaded$.pipe(take(1)).subscribe(m => {
      this.messageThreadLoaded = m;
      if (this.messageThreadLoaded === true) { // Check if TRUE. If FALSE, the messages are not loaded, so exit out.
        /*
          Eventually we'll hit this code block, no matter how long it takes for the messages to come back from the hub.
          This does the scrolling...
        */
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
        this.scrollBottomCount++;  // Important: to prevent subsequent invocation within ngAfterViewChecked() while on "Messages" tab.
        console.log(`this.scrollBottomCount AFTER SCROLL: ${this.scrollBottomCount}`)
        console.log(`this.messageThreadloaded AFTER SCROLL: ${this.messageThreadLoaded}`)

        /*
          messageThreadLoaded is true after createHubConnection returns a set of messages,
          That process also updates DateRead for unread messages. So we can update the unread messages counter now.
          We want unread messages counter to decrease by the number of unread messages that the user has for this member's profile.
          NOTE: Even if unreadMessages > messages initially loaded in chat box (e.g. 20 unread but only 15 returned initially in chat box)
          the unread messages counter should still decrease by 20 because this method gets the unread count from the server.
          In createHubConnection() that loads the initial scrolledMessages, the repo will set all unreadMessages in that thread to UtcNow.
          Current functionality will assume that the user "sees" all previously unread messages if they visit that chat box.
          NOTE2: Adding this here slightly slows down initially loading of chat tab.
        */
        this.fetchUnreadMessagesCount();
      }
    });
  }

  fetchUnreadMessagesCount(): void {
    this.messageService.getUnreadMessagesCountApi().subscribe(response => {
      console.log(response);
    }, error => {
      console.log(error);
    });
  }

  sendMessage(): void {
    console.log(`${this.myScrollContainer.nativeElement.scrollTop}`)
    console.log(`${this.myScrollContainer.nativeElement.scrollHeight}`)
    /*
      Custom loading here because Signal R does not use HTTP, so our loading interceptor does not handle the delay.
      Wewant to makes ure the send button gets disabled/shows loading after it sends the message for a little while.
      Use this in the HTML to disable send message button if loading is true.
    */
    this.loading = true;
    /*
      this.username is for the other user
      sendMessage takes the recipient username, then the messageContent.
    */
    this.messageService.sendMessage(this.username, this.messageContent).then(() => {
      this.messageForm.reset();
    }).finally(() => {
      // reset to false
      this.loading = false;
      setTimeout(() => {
        // currently needs this setTimeout so that message thread waits for the new message to arrive before auto-scroll
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      }, 50);
    });
  }
}

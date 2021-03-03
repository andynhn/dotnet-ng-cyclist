import { Component, OnDestroy, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { take } from 'rxjs/operators';
import { Member } from '../_models/member';
import { User } from '../_models/user';
import { AccountService } from '../_services/account.service';
import { LoadingService } from '../_services/loading.service';
import { MembersService } from '../_services/members.service';
import { MessageService } from '../_services/message.service';
import { PresenceService } from '../_services/presence.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  otherMembers: [];
  selectedMember: Member;
  selectedChat = false;
  user: User;         // the current user
  activePage: string;
  loading = false;

  constructor(private messageService: MessageService,
              private accountService: AccountService,
              private memberService: MembersService,
              private loadingService: LoadingService,
              private toastr: ToastrService,
              public presence: PresenceService) {
    this.accountService.currentUser$.pipe(take(1)).subscribe(user => this.user = user); // get current user from AccountService
  }

  ngOnInit(): void {
    this.loading = true;
    this.activePage = 'Chat';
    this.messageService.getMessageGroupsByUsername().subscribe(response => {
      this.otherMembers = response;
      console.log(this.otherMembers);
      this.loading = false;
    });
    console.log(this.activePage);
  }

  getMemberChat(member): void {
    // if it's the first time they click on a chat while on this page, these will be null/undefined
    if (!this.selectedChat && !this.selectedMember) {
      // set them after the initial click on a chat
      this.selectedMember = member;
      this.selectedChat = true;
      // proceed with starting a hub connection
      this.messageService.createHubConnection(this.user, this.selectedMember.username);
    } else {
      // but if the above conditions are TRUE, then they are clicking on a different username while an existing chat is already loaded.
      // We need to terminate the existing hub connection and then start the next hub connection for the next member they are clicking on
      this.messageService.stopHubConnection();
      this.selectedChat = false;
      this.selectedMember = null;
      // wait a couple seconds...then start the hub connection for the next user.
      this.loadingService.setToLoading();
      setTimeout(() => {
        this.selectedMember = member;
        this.selectedChat = true;
        this.messageService.createHubConnection(this.user, this.selectedMember.username);
        this.loadingService.setToIdle();
        this.loading = false;
      }, 500);
    }
  }

  ngOnDestroy(): void {
    this.loading = false;
    this.activePage = null;
    this.otherMembers = [];
    this.selectedMember = null;
    this.selectedChat = false;
    this.messageService.stopHubConnection();
  }



}

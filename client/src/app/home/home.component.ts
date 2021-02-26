import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ToastrService } from 'ngx-toastr';
import { take } from 'rxjs/operators';
import { IntroModalComponent } from '../modals/intro-modal/intro-modal.component';
import { Message } from '../_models/message';
import { PageParams } from '../_models/pageParams';
import { Pagination } from '../_models/pagination';
import { User } from '../_models/user';
import { AccountService } from '../_services/account.service';
import { ConfirmService } from '../_services/confirm.service';
import { MessageService } from '../_services/message.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  user: User;
  messages: Message[];
  pagination: Pagination;
  pageParams: PageParams;
  loading = false;
  bsModalRef: BsModalRef;
  isNewUser = false;

  constructor(public accountService: AccountService,
              private modalService: BsModalService,
              private router: Router,
              private toastr: ToastrService,
              private messageService: MessageService,
              private confirmService: ConfirmService) {
    this.accountService.currentUser$.pipe(take(1)).subscribe(user => this.user = user);
    this.pageParams = this.messageService.getPageParams();
    const navigation = this.router.getCurrentNavigation();
    this.isNewUser = navigation?.extras?.state?.isNewUser;
   }

  ngOnInit(): void {
    // If the user just registered, display the Intro modal and skip the standard init methods for this component.
    if (this.isNewUser === true) {
      this.openIntroModal(this.user);
      this.isNewUser = false;
    } else {
      this.loadMessages();
      this.fetchUnreadMessagesCount();
    }
  }

  fetchUnreadMessagesCount(): void {
    this.messageService.getUnreadMessagesCountApi().subscribe(response => {
      console.log(response);
    }, error => {
      console.log(error);
    });
  }

  openIntroModal(user: User) {
    const config = {
      class: 'modal-dialog-centered',
      initialState: {
        user
      }
    }
    this.bsModalRef = this.modalService.show(IntroModalComponent, config);
  }

  loadMessages() {
    console.log('loadMessages home.component.ts');
    this.loading = true;
    this.messageService.setPageParams(this.pageParams);
    this.messageService.getMessages(this.pageParams).subscribe(response => {
      this.messages = response.result;
      this.pagination = response.pagination;
      if (this.pageParams.container === 'Unread') {
        this.messageService.setUnreadMessagesCount(response.pagination.totalItems);
      }
      this.loading = false; // quick way to hide messages here until they are finished loading. Fixes issue with photos out of sync
    }, error => {
      console.log(error);
    });
  }

  deleteMessage(id: number) {
    this.confirmService.confirm('Confirm delete message', 'This cannot be undone').subscribe(result => {
      if (result) {
        this.messageService.deleteMessage(id).subscribe(() => {
          // then after the service deletes it, remove that message from the array of messages.
          this.messages.splice(this.messages.findIndex(m => m.id === id), 1);
        });
      }
    });
  }

  pageChanged(event: any) {
    console.log(event);
    this.pageParams.pageNumber = event.page;
    this.messageService.setPageParams(this.pageParams);
    this.loadMessages();
  }

  ngOnDestroy() {
    this.messageService.resetPageParams();
  }

}

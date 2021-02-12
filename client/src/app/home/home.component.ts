import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { take } from 'rxjs/operators';
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
export class HomeComponent implements OnInit {
  user: User;
  messages: Message[];
  pagination: Pagination;
  pageParams: PageParams;
  // container = 'Unread';
  // pageNumber = 1;
  // pageSize = 5;
  loading = false;

  constructor(public accountService: AccountService,
              private toastr: ToastrService,
              private messageService: MessageService,
              private confirmService: ConfirmService) {
    this.accountService.currentUser$.pipe(take(1)).subscribe(user => this.user = user);
    this.pageParams = this.messageService.getPageParams();
   }

  ngOnInit(): void {
    this.loadMessages();
  }

  loadMessages() {
    this.loading = true;
    this.messageService.setPageParams(this.pageParams);
    this.messageService.getMessages(this.pageParams).subscribe(response => {
      console.log(response);
      this.messages = response.result;
      this.pagination = response.pagination;
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

}

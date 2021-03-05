import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { User } from 'src/app/_models/user';

@Component({
  selector: 'app-delete-account-modal',
  templateUrl: './delete-account-modal.component.html',
  styleUrls: ['./delete-account-modal.component.css']
})
export class DeleteAccountModalComponent implements OnInit {
  @Input() deleteUserAccount = new EventEmitter();
  user: User;
  constructor(public bsModalRef: BsModalRef) { }

  ngOnInit(): void {
  }

  deleteAccount() {
    this.deleteUserAccount.emit(this.user);
    this.bsModalRef.hide();
  }

}

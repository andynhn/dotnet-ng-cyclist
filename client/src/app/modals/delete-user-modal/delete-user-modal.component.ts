import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { User } from 'src/app/_models/user';

@Component({
  selector: 'app-delete-user-modal',
  templateUrl: './delete-user-modal.component.html',
  styleUrls: ['./delete-user-modal.component.css']
})
export class DeleteUserModalComponent implements OnInit {
  @Input() deleteSelectedUser = new EventEmitter();
  user: User;
  constructor(public bsModalRef: BsModalRef) { }

  ngOnInit(): void {
  }

  deleteUser() {
    this.deleteSelectedUser.emit(this.user);
    this.bsModalRef.hide();
  }

}

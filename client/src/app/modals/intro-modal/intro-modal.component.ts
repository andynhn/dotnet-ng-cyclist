import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { User } from 'src/app/_models/user';

@Component({
  selector: 'app-intro-modal',
  templateUrl: './intro-modal.component.html',
  styleUrls: ['./intro-modal.component.css']
})
export class IntroModalComponent implements OnInit {
  user: User;

  constructor(public bsModalRef: BsModalRef) { }

  ngOnInit(): void {
  }

}

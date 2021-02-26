import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-landing-chat',
  templateUrl: './landing-chat.component.html',
  styleUrls: ['./landing-chat.component.css']
})
export class LandingChatComponent implements OnInit {
  @Output() cancelChatEmitToLandingFromChat = new EventEmitter();
  @Output() cancelChatEmitToLandingFromChatLoadRegister = new EventEmitter();
  @Output() cancelChatEmitToLandingFromChatLoadRegisterLoadDiscover = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
  }

  cancel() {
    this.cancelChatEmitToLandingFromChat.emit(false);
  }

  cancelToRegister() {
    this.cancelChatEmitToLandingFromChatLoadRegister.emit(false);
  }

  cancelToDiscover() {
    this.cancelChatEmitToLandingFromChatLoadRegisterLoadDiscover.emit(false);
  }

}

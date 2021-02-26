import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-landing-discover',
  templateUrl: './landing-discover.component.html',
  styleUrls: ['./landing-discover.component.css']
})
export class LandingDiscoverComponent implements OnInit {
  @Output() cancelDiscoverEmitToLandingFromDiscover = new EventEmitter();
  @Output() cancelDiscoverEmitToLandingFromDiscoverLoadChat = new EventEmitter();
  @Output() cancelDiscoverEmitToLandingFromDiscoverLoadCustomize = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
  }

  cancel() {
    this.cancelDiscoverEmitToLandingFromDiscover.emit(false);
  }

  cancelToChat() {
    this.cancelDiscoverEmitToLandingFromDiscoverLoadChat.emit(false);
  }

  cancelToCustomize() {
    this.cancelDiscoverEmitToLandingFromDiscoverLoadCustomize.emit(false);
  }

}

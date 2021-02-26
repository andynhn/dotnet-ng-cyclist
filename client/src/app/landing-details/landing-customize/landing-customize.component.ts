import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-landing-customize',
  templateUrl: './landing-customize.component.html',
  styleUrls: ['./landing-customize.component.css']
})
export class LandingCustomizeComponent implements OnInit {
  @Output() cancelCustomizeEmitToLandingFromCustomize = new EventEmitter();
  @Output() cancelCustomizeEmitToLandingFromCustomizeLoadDiscover = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
  }

  cancel() {
    this.cancelCustomizeEmitToLandingFromCustomize.emit(false);
  }

  cancelToDiscover() {
    this.cancelCustomizeEmitToLandingFromCustomizeLoadDiscover.emit(false);
  }

}

import { Component, Input, OnInit } from '@angular/core';
import { Member } from 'src/app/_models/member';
import { PresenceService } from 'src/app/_services/presence.service';

@Component({
  selector: 'app-member-card',
  templateUrl: './member-card.component.html',
  styleUrls: ['./member-card.component.css']
})
export class MemberCardComponent implements OnInit {
  // value is passed down from Parent (discover-members) to Child (Member-card). Describe variable accordingly.
  @Input() memberFromMemberCardComponent: Member;

  constructor(public presence: PresenceService) { }

  ngOnInit(): void {
  }

}

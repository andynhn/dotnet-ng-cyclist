import { Component, OnInit } from '@angular/core';
import { Member } from 'src/app/_models/member';
import { Pagination } from 'src/app/_models/pagination';
import { User } from 'src/app/_models/user';
import { UserParams } from 'src/app/_models/userParams';
import { MembersService } from 'src/app/_services/members.service';

@Component({
  selector: 'app-discover-members',
  templateUrl: './discover-members.component.html',
  styleUrls: ['./discover-members.component.css']
})
export class DiscoverMembersComponent implements OnInit {
  members: Member[];
  user: User;
  pagination: Pagination;
  userParams: UserParams;
  genderList = [
    {value: 'all', display: ''},
    {value: 'male', display: 'Male'},
    {value: 'female', display: 'Female'}
  ];
  cyclingFrequency = [
    {value: 'all', display: ''},
    {value: 'daily', display: 'Daily'},
    {value: 'weekly', display: 'Weekly'}, 
    {value: 'monthly', display: 'Monthly'}
  ];
  cyclingCategory = [
    {value: 'all', display: ''},
    {value: 'road', display: 'Road'},
    {value: 'gravel', display: 'Gravel'},
    {value: 'mountain', display: 'Mountain'}
  ];
  skillLevel = [
    {value: 'all', display: ''},
    {value: 'beginner', display: 'Beginner'},
    {value: 'intermediate', display: 'Intermediate'},
    {value: 'advanced', display: 'Advanced'}
  ];

  constructor(private memberService: MembersService) {
    this.userParams = this.memberService.getUserParams();
  }

  ngOnInit(): void {
    this.loadMembers();
  }

  loadMembers() {
    this.memberService.setUserParams(this.userParams);
    this.memberService.getMembers(this.userParams).subscribe(response => {
      this.members = response.result;
      this.pagination = response.pagination;
    });
  }

  /**
   * method to reset filters on the member list page.
   * pass in this.user so that it gets set to what the page was initialized at.
   * then loadMembers again.
   */
  resetFilters() {
    this.userParams = this.memberService.resetUserParams();
    this.loadMembers();
  }

  pageChanged(event: any) {
    this.userParams.pageNumber = event.page;
    this.memberService.setUserParams(this.userParams);
    this.loadMembers();
  }
}

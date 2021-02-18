import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { BsDropdownConfig } from 'ngx-bootstrap/dropdown';
import { Member } from 'src/app/_models/member';
import { Pagination } from 'src/app/_models/pagination';
import { User } from 'src/app/_models/user';
import { UserParams } from 'src/app/_models/userParams';
import { MembersService } from 'src/app/_services/members.service';

@Component({
  selector: 'app-discover-members',
  templateUrl: './discover-members.component.html',
  styleUrls: ['./discover-members.component.css'],
  providers: [{ provide: BsDropdownConfig, useValue: { isAnimated: true, autoClose: true } }]
})
export class DiscoverMembersComponent implements OnInit {
  members: Member[];
  user: User;
  pagination: Pagination;
  userParams: UserParams;
  genderList = [
    {value: 'all', display: ''},
    {value: 'female', display: 'Female'},
    {value: 'male', display: 'Male'}
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
  states: object;
  cities: string[] = [];
  loading = false;
  selectedState = '';

  constructor(private memberService: MembersService, private http: HttpClient) {
    this.userParams = this.memberService.getUserParams();
  }

  ngOnInit(): void {
    this.getCityStates();
    this.loadMembers();
    this.userParams.city = '';
    this.userParams.state = '';
  }

  getCityStates(): any {
    this.http.get('../../assets/cityStates.json').subscribe(data => {
      this.states = data;
    });
  }

  changeState(data) {
    console.log(data);
    if (!data) {
      console.log('no state selected')
      this.selectedState = '';
    }
    if (data) {
      this.selectedState = data;
      console.log('made it here');
      this.cities = this.states[data];
    }
  }

  loadMembers() {
    this.loading = true;
    this.memberService.setUserParams(this.userParams);
    this.memberService.getMembers(this.userParams).subscribe(response => {
      this.members = response.result;
      this.pagination = response.pagination;
      if (this.userParams.nameSearch === 'all') {
        this.userParams.nameSearch = '';
      }
      if (this.userParams.state === 'all') {
        this.userParams.state = '';
        this.selectedState = '';
      }
      if (this.userParams.city === 'all') {
        this.userParams.city = '';
      }
      this.loading = false;
      console.log(this.userParams);
    });
  }

  /**
   * method to reset filters on the member list page.
   * pass in this.user so that it gets set to what the page was initialized at.
   * then loadMembers again.
   */
  resetFilters() {
    // reset the userParams in this component with fresh params from the service.
    this.userParams = this.memberService.resetUserParams();
    this.loadMembers();
  }

  pageChanged(event: any) {
    this.userParams.pageNumber = event.page;
    this.memberService.setUserParams(this.userParams);
    this.loadMembers();
  }
}

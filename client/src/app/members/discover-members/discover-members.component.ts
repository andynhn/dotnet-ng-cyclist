import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { BsDropdownConfig } from 'ngx-bootstrap/dropdown';
import { Member } from 'src/app/_models/member';
import { Pagination } from 'src/app/_models/pagination';
import { User } from 'src/app/_models/user';
import { UserParams } from 'src/app/_models/userParams';
import { MembersService } from 'src/app/_services/members.service';
import { MessageService } from 'src/app/_services/message.service';

@Component({
  selector: 'app-discover-members',
  templateUrl: './discover-members.component.html',
  styleUrls: ['./discover-members.component.css'],
  providers: [{ provide: BsDropdownConfig, useValue: { isAnimated: true, autoClose: true } }]
})
export class DiscoverMembersComponent implements OnInit, OnDestroy {
  members: Member[];
  user: User;
  pagination: Pagination;
  userParams: UserParams;
  genderList = [
    {value: '', display: ''},
    {value: 'female', display: 'Female'},
    {value: 'male', display: 'Male'}
  ];
  cyclingFrequency = [
    {value: '', display: ''},
    {value: 'daily', display: 'Daily'},
    {value: 'weekly', display: 'Weekly'},
    {value: 'monthly', display: 'Monthly'}
  ];
  cyclingCategory = [
    {value: '', display: ''},
    {value: 'road', display: 'Road'},
    {value: 'gravel', display: 'Gravel'},
    {value: 'mountain', display: 'Mountain'}
  ];
  skillLevel = [
    {value: '', display: ''},
    {value: 'beginner', display: 'Beginner'},
    {value: 'intermediate', display: 'Intermediate'},
    {value: 'advanced', display: 'Advanced'}
  ];
  states: object;
  cities: string[] = [];
  loading = false;
  selectedState = '';

  constructor(private memberService: MembersService, private http: HttpClient, private messageService: MessageService) {
    this.userParams = this.memberService.getUserParams();
  }

  ngOnInit(): void {
    this.getCityStates();
    this.fetchUnreadMessagesCount();
  }

  fetchUnreadMessagesCount(): void {
    this.messageService.getUnreadMessagesCountApi().subscribe(() => {
    }, error => {
      console.log(error);
    });
  }

  getCityStates(): any {
    // loadMembers also sets loading to true. That's needed for form submit.
    // Set to true here for onInit because it will take some time for cityStates.json to load.
    // May take longer than loadMembers, so set to false in loadMembers.
    this.loading = true;
    this.http.get('../../assets/cityStates.json').subscribe(data => {
      this.states = data;
      // call load member here so that city states json gets loaded in time. Form needs this data.
      this.loadMembers();
    });
  }

  changeState(data) {
    if (!data) {
      // if no state selected, reset data that userParams.city relies on.
      this.selectedState = '';
      this.cities = [];
      this.userParams.city = '';
    }
    if (data) {
      this.selectedState = data;
      this.cities = this.states[this.selectedState];
    }
  }

  /**
   * Method for getting members from the service.
   * Called each time a user submits Search Filter form.
   * This should only be used for the initial load of members from a given search query.
   * This should NOT be used within the pageChanged() method for loading members for a new page of the same search.
   * Pagination relies on unique logic that tracks pageNumber given the previous number, etc.
   * Using this method to load users for page change will cause issues.
   */
  loadMembers() {
    this.loading = true;
    // set pagenumber to 1 here for when user makes a new search but while on a different page of an existing search.
    // Pagination logic is set to skip (currentPage - 1 * pageSize)  results of the total query results.
    // If user makes new search while on a page > 1, pagination will have issues and return faulty data.
    // (Example: On page 2 of current results, page size of 10 items. User makes a new search. Expecting 3 total items.
    // Without the reset of pageNumber to 1, server logic would "Skip" the 3 items because it would try to return results for
    // page 2 of that search query, which doesn't exist for the 3 items.)
    this.userParams.pageNumber = 1;
    this.memberService.setUserParams(this.userParams);
    this.memberService.getMembers(this.userParams).subscribe(response => {
      this.members = response.result;
      this.pagination = response.pagination;
      this.loading = false;
    });
  }

  /**
   * method to reset filters on the member list page.
   * pass in this.user so that it gets set to what the page was initialized at.
   * then loadMembers again.
   */
  resetFilters() {
    // reset the userParams in this component with fresh params from the service.
    this.selectedState = '';
    this.userParams = this.memberService.resetUserParams();
    this.loadMembers();
  }

  pageChanged(event: any) {
    this.loading = true;
    this.userParams.pageNumber = event.page;
    this.memberService.setUserParams(this.userParams);
    // get members with the new parameters. Only changed parameter should be pageNumber
    // server logic gets all results from the query, but uses pageNumber to "Skip" results in
    // the list depending on the pageNumber passed in.
    this.memberService.getMembers(this.userParams).subscribe(response => {
      this.members = response.result;
      this.pagination = response.pagination;
      this.loading = false;
    });
  }

  ngOnDestroy() {
    this.selectedState = '';
    this.memberService.resetMemberCache();
    this.memberService.resetUserParams();
  }
}

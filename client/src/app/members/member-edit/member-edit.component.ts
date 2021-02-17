import { HttpClient } from '@angular/common/http';
import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { take } from 'rxjs/operators';
import { Member } from 'src/app/_models/member';
import { User } from 'src/app/_models/user';
import { AccountService } from 'src/app/_services/account.service';
import { MembersService } from 'src/app/_services/members.service';

@Component({
  selector: 'app-member-edit',
  templateUrl: './member-edit.component.html',
  styleUrls: ['./member-edit.component.css']
})
export class MemberEditComponent implements OnInit {
  @ViewChild('editForm') editForm: NgForm; // this gives us access to the #editForm template form inside our component html...
  /// ... so that we can act on it if/when it gets modified

  member: Member;
  user: User;
  skillLevel: string[] = ['beginner', 'intermediate', 'advanced'];
  cyclingFrequency: string[] = ['daily', 'weekly', 'monthly'];
  cyclingCategory: string[] = ['road', 'gravel', 'mountain'];
  states: object;
  cities: string[] = [];
  selectedState = '';
  loading = false;

  // HostListener lets us access our browser everts. This notifies user that the form is unsaved if they close the browser
  @HostListener('window:beforeunload', ['$event']) unloadNotification($event: any) {
    if (this.editForm.dirty) {
      $event.returnValue = true;
    }
  }

  constructor(private accountService: AccountService,
              private memberService: MembersService,
              private toastr: ToastrService,
              private http: HttpClient) {
    this.accountService.currentUser$.pipe(take(1)).subscribe(user => this.user = user);
   }

  ngOnInit(): void {
    this.getCityStates();
  }

  getCityStates(): any {
    this.http.get('../../assets/cityStates.json').subscribe(data => {
      console.log(data);
      console.log(this.selectedState);
      this.states = data;
      console.log(this.cities);
      // call load member here so that city states json gets loaded in time. 
      // Need to get the list of cities for the form.
      this.loadMember();
    });
  }

  changeState(data) {
    console.log(data);
    if (!data) {
      console.log('no data here')
      this.selectedState = '';
    }
    if (data) {
      this.selectedState = data;
      console.log('made it here');
      this.cities = this.states[data];
    }
  }

  loadMember() {
    this.memberService.getMember(this.user.username).subscribe(m => {
      // should come back as lower case, so for the Member Edit feature, we want to display their data as Title case.
      // later, when they save, we transform back to lower.
      m.firstName = m.firstName.charAt(0).toUpperCase() + m.firstName.toLowerCase().slice(1);
      m.lastName = m.lastName.charAt(0).toUpperCase() + m.lastName.toLowerCase().slice(1);
      this.selectedState = m.state;
      console.log(this.selectedState);
      // then set the member variable to the modified resposne from the service.
      this.member = m;
      // Essential for initial loading of page and preparing the edit form.
      // Cities from json file should have loaded, so now we can assign it.
      this.cities = this.states[this.selectedState];
      console.log(this.member.city);
      this.loading = false;
    });
  }

  updateMember() {
    // set loading to true to hide the edit form while these API calls are being made.
    this.loading = true;
    this.memberService.updateMember(this.member).subscribe(() => {
      this.toastr.success('Profile updated successfully');
      this.editForm.reset(this.member); // reset the editForm template after update.
      // Finally, we need to laod the member again so that the edit form has the
      // updated information when it's done saving.
      this.loadMember();
    });
  }

}

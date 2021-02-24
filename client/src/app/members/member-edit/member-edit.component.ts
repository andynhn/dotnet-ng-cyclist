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
      // call load member here so that city states json gets loaded in time. Form needs this data.
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
      // FOR LOOP primarily for skipping the main Admin, which doesn't need the text transformations on some data.
      //  Need to skip for now because normal users must provide first and last name on registration.
      // Primary seeded Admin does not, so this form will crash for them. Prevent crashing by skipping text transformations.
      for (const role of this.user.roles) {
        // check if the role is 'Admin'
        if (role === 'Admin') {
          // if 'Admin', check if it's the primary admin.
          if (this.user.username.toLowerCase() === 'admin') {
            // if it's the main Admin, break out of this for loop. No need to transfrom data for the form. Just return the member data.
            break;
          } else {
            // if an Admin, but not the main admin, it means they are a normal member as well. So continue/skip this loop interation.
            continue;
          }
        // If NOT an admin role....most normal users will skip straight here (only have one role as a member)
        } else {
          // Title case transformations for displaying on the form
          m.firstName = m.firstName.charAt(0).toUpperCase() + m.firstName.toLowerCase().slice(1);
          m.lastName = m.lastName.charAt(0).toUpperCase() + m.lastName.toLowerCase().slice(1);
          // selectedState variable needed for dynamic hiding/displaying of city dropdown
          this.selectedState = m.state;
          console.log(this.selectedState);
          // Cities from json file should have loaded, so now we can assign it. This will dynamically fill cities dropdown with...
          // ...a list of cities for that particular state.
          this.cities = this.states[this.selectedState];
        }
      }

      // FINALLY, set the member variable to the response from the service.
      this.member = m;
      this.loading = false;
    });
  }

  updateMember() {
    // set loading to true to hide the edit form while these API calls are being made.
    this.loading = true;
    this.memberService.updateMember(this.member).subscribe(() => {
      this.user.firstName = this.member.firstName;
      this.user.lastName = this.member.lastName;
      // updates both our current user observable and our properties inside local storage.
      this.accountService.setCurrentUser(this.user);
      this.toastr.success('Profile updated successfully');
      this.editForm.reset(this.member); // reset the editForm template after update.
      // Finally, we need to laod the member again so that the edit form has the
      // updated information when it's done saving.
      this.loadMember();
    });
  }

}

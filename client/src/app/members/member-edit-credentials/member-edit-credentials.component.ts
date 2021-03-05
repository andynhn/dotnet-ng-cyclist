import { HttpClient } from '@angular/common/http';
import { ViewCompileResult } from '@angular/compiler/src/view_compiler/view_compiler';
import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, NgForm, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { take } from 'rxjs/operators';
import { Member } from 'src/app/_models/member';
import { User } from 'src/app/_models/user';
import { AccountService } from 'src/app/_services/account.service';
import { MembersService } from 'src/app/_services/members.service';

@Component({
  selector: 'app-member-edit-credentials',
  templateUrl: './member-edit-credentials.component.html',
  styleUrls: ['./member-edit-credentials.component.css']
})
export class MemberEditCredentialsComponent implements OnInit, OnDestroy {
  editCredsForm: FormGroup;
  member: Member;
  user: User;
  loading = false;
  validationErrors: string[] = [];

  constructor(private accountService: AccountService,
              private memberService: MembersService,
              private toastr: ToastrService,
              private fb: FormBuilder,
              private router: Router,
              private http: HttpClient) {
  this.accountService.currentUser$.pipe(take(1)).subscribe(user => this.user = user);
  }

  ngOnInit(): void {
    this.loading = true;
    this.initializeForm();
    this.loadMember();
  }

  updateCredentials() {
    // clear out the validation errors array each time they submit
    this.validationErrors = [];
    this.memberService.updateMemberCredentials(this.editCredsForm.value).subscribe(response => {
      this.toastr.success('Credentials updated successfully');
      this.router.navigateByUrl('/member/edit');
    }, error => {
      if (Object.keys(error.error).length === 1) {
        // Loop through that first (and only) object within error.error
        for (const [key, value] of Object.entries(error.error)) {
          // this object should have some objects within it.
          // For change password, know for sure it has "code" and "description" keys.
          // Description is what we want to display in the toast message. So loop through those objects.
          for (const [key2, value2 ] of Object.entries(error.error[key])) {
            if (key2.toString() === 'description') {
              this.validationErrors.push(value2.toString())
            }
          }
        }
      } else {
        this.validationErrors = error;
      }
      this.editCredsForm.reset();

    });
  }

  initializeForm() {
    this.editCredsForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8),
        Validators.maxLength(100)]],
      newPassword: ['', [Validators.required, Validators.minLength(3),
        Validators.maxLength(30)]],
      confirmNewPassword: ['', [Validators.required, this.matchValues('newPassword')]]
    });
  }

  matchValues(matchTo: string): ValidatorFn {
    return (control: AbstractControl) => {
      // comfirm new password control compared to the new password field. if passwords match, we return null. If not, we return isMatching
      // to control which will fail form validation
      return control?.value === control?.parent?.controls[matchTo].value
        ? null : {isMatching: true};
    }
  }

  loadMember() {
    this.memberService.getMember(this.user.username).subscribe(m => {
      this.member = m;
      this.loading = false;
    });
  }

  cancel() {
    this.validationErrors = [];
    this.router.navigateByUrl(`/member/edit`);
  }

  ngOnDestroy() {
    this.validationErrors = [];
  }
}

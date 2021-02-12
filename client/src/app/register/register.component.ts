import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AccountService } from '../_services/account.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  @Output() cancelRegisterEmitToLandingFromRegister = new EventEmitter ();
  registerForm: FormGroup;
  maxDate: Date;
  validationErrors: string[] = [];

  constructor(private accountService: AccountService, private toastr: ToastrService, private fb: FormBuilder, private router: Router) { }

  ngOnInit(): void {
    this.initializeForm();
    // must be over 18 years old.
    this.maxDate = new Date();
    this.maxDate.setFullYear(this.maxDate.getFullYear() - 18);
  }

  initializeForm() {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      city: ['', Validators.required],
      country: ['', Validators.required],
      gender: ['female'],
      cyclingFrequency: ['daily'],
      cyclingCategory: ['road'],
      skillLevel: ['beginner'],
      password: ['', [Validators.required, Validators.minLength(8),
        Validators.maxLength(250)]],
      confirmPassword: ['', [Validators.required, this.matchValues('password')]]
    });
  }

  // custom validator
  matchValues(matchTo: string): ValidatorFn {
    return (control: AbstractControl) => {
      // comfirm password control compared to the password field. if passwords match, we return null. If not, we return isMatching
      // to control which will fail form validation
      return control?.value === control?.parent?.controls[matchTo].value
        ? null : {isMatching: true};
    }
  }

  register() {
    this.accountService.register(this.registerForm.value).subscribe(response => {
      this.router.navigateByUrl('/home');
    }, error => {
      this.validationErrors = error;
    });
  }

  cancel() {
    this.cancelRegisterEmitToLandingFromRegister.emit(false);
  }
}

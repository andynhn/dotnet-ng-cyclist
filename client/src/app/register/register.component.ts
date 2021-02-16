import { HttpClient } from '@angular/common/http';
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
  states: object;
  cities: string[] = [];
  selectedState = '';
  loading = false;
  genders = ['female', 'male', 'other'];

  constructor(private accountService: AccountService,
              private toastr: ToastrService,
              private fb: FormBuilder,
              private router: Router,
              private http: HttpClient) {

  }

  ngOnInit(): void {
    this.getCityStates();
    this.initializeForm();
    // must be over 18 years old.
    this.maxDate = new Date();
    this.maxDate.setFullYear(this.maxDate.getFullYear() - 18);
  }

  getCityStates(): any {
    this.loading = true;
    this.http.get('../../assets/cityStates.json').subscribe(data => {
      console.log(data);
      console.log(this.selectedState);
      this.states = data;
      this.loading = false;
      console.log(this.cities);
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

  initializeForm() {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3),
        Validators.maxLength(30)]],
      firstName: ['', [Validators.required,
        Validators.maxLength(30)]],
      lastName: ['', [Validators.required,
        Validators.maxLength(30)]],
      dateOfBirth: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      gender: ['', Validators.required],
      cyclingFrequency: ['daily'],
      cyclingCategory: ['road'],
      skillLevel: ['beginner'],
      password: ['', [Validators.required, Validators.minLength(8),
        Validators.maxLength(100)]],
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

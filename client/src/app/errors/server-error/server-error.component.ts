import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-server-error',
  templateUrl: './server-error.component.html',
  styleUrls: ['./server-error.component.css']
})
export class ServerErrorComponent implements OnInit {
  error: any;

  constructor(private router: Router) {
    // We get the navigation state once when the route is activated
    // If there are any errors in the navigation extras, we can redirect a user to this component.
    // use optional chaining operators for good measure
    const navigation = this.router.getCurrentNavigation();
    this.error = navigation?.extras?.state?.error;
  }

  ngOnInit(): void {
  }

}

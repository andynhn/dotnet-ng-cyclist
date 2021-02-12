import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  loadingSpinner: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  loadingRequestCount = 0;

  constructor() { }

  setToLoading(): void {
    this.loadingRequestCount++;
    this.loadingSpinner.next(true);
  }

  setToIdle(): void {
    this.loadingRequestCount--;
    if (this.loadingRequestCount <= 0) {
      this.loadingRequestCount = 0;
      this.loadingSpinner.next(false);
    }
  }
}

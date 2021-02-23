import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  loadingSpinner: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  loadingRequestCount = 0;

  constructor() { }

  /**
   * Primary method for activating our loading indicator.
   */
  setToLoading(): void {
    this.loadingRequestCount++;       // increment loading requests.
    this.loadingSpinner.next(true);   // when active, we set to true
  }

  /**
   * Primary method for deactivating our loading indicator.
   */
  setToIdle(): void {
    this.loadingRequestCount--;
    if (this.loadingRequestCount <= 0) {  // if no more loading requests...
      this.loadingRequestCount = 0;     // reset count to 0, then set loading indicator to false.
      this.loadingSpinner.next(false);
    }
  }
}

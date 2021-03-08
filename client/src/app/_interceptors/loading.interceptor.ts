import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoadingService } from '../_services/loading.service';
import { delay, finalize } from 'rxjs/operators';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {

  constructor(private loadingService: LoadingService) {}

  /**
   * Intercepts HTTP requests for the loading indicator. When a request starts,
   * set loadingSpinner property in the LoadingService to true. When the request is done and sends a response,
   * set the loadingSpinner property to false.
   * Specify these interceptors as a provider in app.module.ts.
   */
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // when we intercept the http request, turn on the loading spinner by calling the method in the loading service
    this.loadingService.setToLoading();
    return next.handle(request).pipe(
      // delay(400), // turned off delay for production
      finalize(() => {
        // After the request has been handled, turn off the loading spinner.
        this.loadingService.setToIdle();
      })
    );
  }
}

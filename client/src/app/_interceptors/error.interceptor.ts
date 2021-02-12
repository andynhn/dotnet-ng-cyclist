import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { NavigationExtras, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { LoadingService } from '../_services/loading.service';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(private router: Router, private toastr: ToastrService, private loadingService: LoadingService) {}

  /**
   * HTTP Interceptor responsible for catching and handling errors all throughout the app.
   * Specify these interceptors as a provider in app.module.ts.
   */
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError(error => {
        if (error) {
          switch (error.status) {
            case 400:
              // check if the are multiple errors (an errors array)
              if (error.error.errors) {
                // ASPNET validatino errors known as model state errors
                const modelStateErrors = [];
                for (const key in error.error.errors) {
                  if (error.error.errors[key]) {
                    modelStateErrors.push(error.error.errors[key]);
                  }
                }
                /*
                  We will get an array of arrays, so we can flatten it here for ease of use.
                  Need to add es2018 to lib in tsconfig.json to use flat() for now.
                */
                throw modelStateErrors.flat();
              } else if (typeof(error.error) === 'object') {
                /*
                  Need this else if for when the error.error is an object. Specifically, that will be a bad request.
                  NOTE: I think a potential bug in Angular may be causing statusText to be "OK" for all http responses.
                  Postman validates that these HTTP responses are accurately "400 Bad Reequest, etc.", even though statusText says OK.
                  Instead of displaying error.statusText here (which would be misleading),
                  display the actual hard-coded string in the toastr notifcation for now...
                  TODO: REVISIT THIS.
                */
                this.toastr.error('Bad Request', error.status);
              } else {
                // If error.error is not an object, then display the specific error text here.
                this.toastr.error(error.error, error.status);
              }
              break;

            case 401:
              this.toastr.error('Unauthorized', error.status);
              break;

            case 404:
              // for not found, navigate directly to our custom Not Found component.
              this.router.navigateByUrl('/not-found');
              break;

            case 500:
              // Use navigation extras to get a hold of the error so that
              // we can do sth on the page after we've proceeded to the /server-error route.
              const navigationExtras: NavigationExtras = {state: {error: error.error}};
              this.router.navigateByUrl('/server-error', navigationExtras);
              break;

            default:
              this.toastr.error('Something unexpected went wrong');
              console.log(error);
              break;
          }
        }
        // need to set loadingService to idle here, otherwise, if an error is thrown, the loading spinner will reset to false.
        this.loadingService.setToIdle();

        // We catch most errors in the switch, But if not, return the error to wherever was calling the http request, just in case.
        return throwError(error);
      })
    );
  }
}

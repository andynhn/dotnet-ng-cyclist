import { Injectable } from '@angular/core';
import { CanDeactivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { MemberEditComponent } from '../members/member-edit/member-edit.component';
import { ConfirmService } from '../_services/confirm.service';

@Injectable({
  providedIn: 'root'
})
export class PreventUnsavedChangesGuard implements CanDeactivate<unknown> {
  constructor(private confirmService: ConfirmService) {}
  // guards against navigating away from the specified component.
  // If form is started and unsaved (dirty) and they navigate away, it asks to confirm if it "can deactivate" it.
  /**
   * Guard to prevent navigating away from specified components.
   * Specifically, if a form has not been saved.
   * Make sure to pecify which routes/components use this in app-routing.module.ts
   */
  canDeactivate(component: MemberEditComponent): Observable<boolean> | boolean {
    if (component.editForm.dirty) {
      return this.confirmService.confirm();
    }
    return true;
  }
}

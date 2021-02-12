import { Injectable } from '@angular/core';
import {
  Router, Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { Member } from '../_models/member';
import { MembersService } from '../_services/members.service';

@Injectable({
  providedIn: 'root'
})
export class MemberDetailResolver implements Resolve<Member> {

  constructor(private memberService: MembersService) {}

  /**
   * Route resolver that makes sure that we get the member (by username) before we reach the route.
   * so that we can properly populate the component with member data knowing we already loaded the member.
   * @param route Activated Route snapshot
   * @param state Router State Snapshot
   */
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Member> {
    return this.memberService.getMember(route.paramMap.get('username'));
  }
}

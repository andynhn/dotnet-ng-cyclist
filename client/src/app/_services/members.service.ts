import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Member } from '../_models/member';
import { User } from '../_models/user';
import { UserParams } from '../_models/userParams';
import { AccountService } from './account.service';
import { getPaginatedResult, getPaginationHeaders } from './paginationHelper';

@Injectable({
  providedIn: 'root'
})
export class MembersService {
  baseUrl = environment.apiUrl;
  members: Member[] = [];
  memberCache = new Map();  // implement a cache for pagination, etc.
  user: User;
  userParams: UserParams;

  constructor(private http: HttpClient, private accountService: AccountService) {
    this.accountService.currentUser$.pipe(take(1)).subscribe(user => {
      this.user = user;
      this.userParams = new UserParams(user);
    });
  }

  /**
   * Get members, passing in a list of params. Check the memberCache first if the user set of params were already loaded,
   * otherwise acceses the API.
   * @param userParams Params that the user passes to filter the list of users.
   */
  getMembers(userParams: UserParams) {
    console.log(Object.values(userParams).join('-'));
    /**
     * "key" that stores the userParams so that we can keep track of user activity for caching
     * the key is just the params separated by a hyphen. Idea is for faster loading on on routes that we've already loaded.
     * This response tries to get a value from the memberCache based on the most recent userParams.
     */
    var response = this.memberCache.get(Object.values(userParams).join('-'));

    // if that key exists (meaning the user visited this before, we should bypass our loadingSpinner)
    if (response) {
      // use the Singleton nature of services and send back the user list as an observable (return "of" sends it as an observable).
      return of(response);
    }
    let params = getPaginationHeaders(userParams.pageNumber, userParams.pageSize);

    params = params.append('minAge', userParams.minAge.toString());
    params = params.append('maxAge', userParams.maxAge.toString());
    params = params.append('gender', userParams.gender);
    params = params.append('cyclingFrequency', userParams.cyclingFrequency);
    params = params.append('cyclingCategory', userParams.cyclingCategory);
    params = params.append('skillLevel', userParams.skillLevel);
    params = params.append('orderBy', userParams.orderBy);

    console.log(params);

    // If it passes the above caching functionality, then go to the api, which hits our loading interceptor.
    // Then upon return, add that key params route to the memberCache map.
    // onto the memberCache map so that we avoid the loading Spinner next time.
    return getPaginatedResult<Member[]>(this.baseUrl + 'users', params, this.http).pipe(
      map(paginatedResult => {
        this.memberCache.set(Object.values(userParams).join('-'), paginatedResult);
        return paginatedResult;
      })
    );
  }

  /**
   * Get member, first by checking memberCache array, then by accessing API if not in cache.
   * combine the paginated results from the memberCache values as an array
   * then we reduce our array into something else. We want the results of each array in a single array that we can search
   * REDUCE: As we call the reduce function on each element in our member array, we get the result (which contains
   * the members in our cache) then we concatenate that into an array that we have, which starts with nothing.
   * then the FIND method finds the first instance of the user we want, based on the username passed in.
   */
  getMember(username: string) {
    const member = [...this.memberCache.values()]
      .reduce((arr, elem) => arr.concat(elem.result), [])
      .find((member: Member) => member.username === username);

    // if we find the member in our cache, bypass the loading spinner in the loading interceptor.
    if (member) {
      return of(member);
    }
    return this.http.get<Member>(this.baseUrl + 'users/' + username);
  }

  updateMember(member: Member) {
    // need to update the members array when we update a member.
    return this.http.put(this.baseUrl + 'users', member).pipe(
      map(() => {
        // find the index of the member we just updated.
        const index = this.members.indexOf(member);
        // then update members array so that it has the new changes to that member.
        this.members[index] = member;
      })
    );
  }




  getUserParams() {
    return this.userParams;
  }

  setUserParams(params: UserParams) {
    this.userParams = params;
  }

  resetUserParams() {
    this.userParams = new UserParams(this.user);
    return this.userParams;
  }



  setMainPhoto(photoId: number) {
    return this.http.put(this.baseUrl + 'users/set-main-photo/' + photoId, {});
  }

  deletePhoto(photoId: number) {
    return this.http.delete(this.baseUrl + 'users/delete-photo/' + photoId);
  }
}

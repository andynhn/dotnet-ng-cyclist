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
      this.userParams = new UserParams();
    });
  }

  /**
   * Get members, passing in a list of params. Check the memberCache first if the user set of params were already loaded,
   * otherwise acceses the API.
   * @param userParams Params that the user passes to filter the list of users.
   */
  getMembers(userParams: UserParams) {
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
    userParams.nameSearch = userParams.nameSearch.trim().toLowerCase();
    params = params.append('nameSearch', userParams.nameSearch.length <= 30
      ? userParams.nameSearch
      : userParams.nameSearch.substring(0, 30));
    params = params.append('state', userParams.state);
    params = params.append('city', userParams.city);
    params = params.append('orderBy', userParams.orderBy);

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
    // NOTE: TODO: We used to get the member from the member cache. BUT, there could be issues for the edge case where a profile is deleted
    // but a different member is logged in and has that deleted profile cached. They would see the profile, but it should be deleted.
    // So let's bypass getting the member from the cache for now. Make the api call for all instead.
    // const member = [...this.memberCache.values()]
    //   .reduce((arr, elem) => arr.concat(elem.result), [])
    //   .find((member: Member) => member.username === username);

    // if we find the member in our cache, bypass the loading spinner in the loading interceptor.
    // if (member) {
    //   return of(member);
    // }
    return this.http.get<Member>(this.baseUrl + 'users/' + username).pipe();
  }

  /**
   * Primary method for updating member properties.
   * First, do a lower case transformation on the text input fields so that it's lower case in the db.
   * We do another check in the back end to verify.
   * Then, we update it via the API, but we after the response comes back, we need to update the members array when we update a member.
   * @param member The member to be updated
   */
  updateMember(member: Member) {
    // the following member properties are text inputs, so let's convert to lower.
    member.firstName = member.firstName.toLowerCase();
    member.lastName = member.lastName.toLowerCase();
    // Then, we update it via the API, but we after the response comes back, we need to update the members array when we update a member.
    return this.http.put(this.baseUrl + 'users', member).pipe(
      map(() => {
        // find the index of the member we just updated.
        const index = this.members.indexOf(member);
        // then update members array so that it has the new changes for that member.
        this.members[index] = member;
      })
    );
  }

  /**
   * Method to update the user's password.
   * Makes an API call to the account controller
   * @param model user's password and new password
   */
  updateMemberCredentials(model: any) {
    return this.http.post(this.baseUrl + 'account/updateCredentials', model);
  }




  getUserParams() {
    return this.userParams;
  }

  setUserParams(params: UserParams) {
    this.userParams = params;
  }

  resetUserParams() {
    this.userParams = new UserParams();
    return this.userParams;
  }


  resetMemberCache() {
    this.memberCache = new Map();
  }

  setMainPhoto(photoId: number) {
    return this.http.put(this.baseUrl + 'users/set-main-photo/' + photoId, {});
  }

  deletePhoto(photoId: number) {
    return this.http.delete(this.baseUrl + 'users/delete-photo/' + photoId);
  }
}

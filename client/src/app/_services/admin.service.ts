import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { RolesModalComponent } from '../modals/roles-modal/roles-modal.component';
import { Photo } from '../_models/photo';
import { User } from '../_models/user';
import { UserManageParams } from '../_models/userManageParams';
import { LoadingService } from './loading.service';
import { getPaginatedResult, getPaginationHeaders } from './paginationHelper';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  baseUrl = environment.apiUrl;
  userManageParams: UserManageParams;
  usersWithRolesCache = new Map();
  // property to help with caching. If admin modifies a user, use logic to refresh the cache and reload updated data.
  usersModified = false;

  constructor(private http: HttpClient, private loadingService: LoadingService) {
    this.userManageParams = new UserManageParams();
  }

  /**
   * Primary method for getting a list of users with roles for the admin panel.
   * Must pass in the userManageParams, which are pagination related parameters
   * to help return this users as a paged list for easier navigation in the UI
   */
  getUsersWithRoles(userManageParams: UserManageParams) {
    console.log(Object.values(userManageParams).join('-'))
    // implement caching feature

    if (this.usersModified === true) {
      this.usersWithRolesCache = new Map();
    }

    const response = this.usersWithRolesCache.get(Object.values(userManageParams).join('-'));

    if (response) {
      return of(response);
    }

    let params = getPaginationHeaders(userManageParams.pageNumber, userManageParams.pageSize);

    // append any additional params here if need to later on
    // params = params.append('newParam', usrManageParams.aNewParam)

    // only returning partial user here. don't need all their info.
    return getPaginatedResult<Partial<User[]>>(this.baseUrl + 'admin/users-with-roles', params, this.http).pipe(
      map(paginatedResult => {
        console.log(paginatedResult);
        this.usersModified = false;
        this.usersWithRolesCache.set(Object.values(userManageParams).join('-'), paginatedResult);
        return paginatedResult;
      })
    );
  }

  updateUserRoles(username: string, roles: string[]) {
    return this.http.post(this.baseUrl + 'admin/edit-roles/' + username + '?roles=' + roles, {});
  }

  getPhotosForApproval() {
    return this.http.get<Photo[]>(this.baseUrl + 'admin/photos-to-moderate');
  }

  approvePhoto(photoId: number) {
    return this.http.post(this.baseUrl + 'admin/approve-photo/' + photoId, {});
  }

  rejectPhoto(photoId: number) {
    return this.http.post(this.baseUrl + 'admin/reject-photo/' + photoId, {});
  }


  // methods for pagination involved in Admin Panel
  getUserManageParams() {
    return this.userManageParams;
  }

  setUserManageParams(params: UserManageParams) {
    console.log(params);
    this.userManageParams = params;
  }

  resetUserManageParams() {
    this.userManageParams = new UserManageParams();
  }
}

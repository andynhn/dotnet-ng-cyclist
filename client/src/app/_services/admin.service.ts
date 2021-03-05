import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { RolesModalComponent } from '../modals/roles-modal/roles-modal.component';
import { PaginatedResult } from '../_models/pagination';
import { Photo } from '../_models/photo';
import { PhotoManageParams } from '../_models/photoManageParams';
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
  photoManageParams: PhotoManageParams;
  // Maps that cache users and photos received fro API given a key we provide.
  usersWithRolesCache = new Map();
  photosForModerationCache = new Map();
  // property to help with caching. If admin modifies a user or photo, use logic to refresh the cache and reload updated data.
  usersModified = false;
  photosModified = false;

  constructor(private http: HttpClient, private loadingService: LoadingService) {
    // need to initialize these params
    this.userManageParams = new UserManageParams();
    this.photoManageParams = new PhotoManageParams();
  }



  // ------------------ MANAGE USERS -------------------

  /**
   * Primary method for getting a list of users with roles for the admin panel.
   * Must pass in the userManageParams, which are pagination related parameters
   * to help return this users as a paged list for easier navigation in the UI
   */
  getUsersWithRoles(userManageParams: UserManageParams) {
    // implement cache feature...1) If true, reset cache. Users were modified so need to refetch users list.
    if (this.usersModified === true) {
      this.usersWithRolesCache = new Map();
    }

    // Check the cache for the key.
    const response = this.usersWithRolesCache.get(Object.values(userManageParams).join('-'));

    // if the response exists, return the value of the key we provided.
    // the value is the list of users.
    if (response) {
      return of(response);
    }

    // if not, then we don't have those users in the cache. Begin process to set params, get users, then save to cache.
    let params = getPaginationHeaders(userManageParams.pageNumber, userManageParams.pageSize);

    // append any additional params here if need to later on
    // params = params.append('newParam', usrManageParams.aNewParam)
    userManageParams.usernameSearch = userManageParams.usernameSearch.trim().toLowerCase();
    params = params.append('usernameSearch', userManageParams.usernameSearch.length <= 30
      ? userManageParams.usernameSearch
      : userManageParams.usernameSearch.substring(0, 30));
    // roles are in an array. turn into a comma separated string.
    params = params.append('roles', userManageParams.roles.join(','));
    params = params.append('orderBy', userManageParams.orderBy);

    // only returning partial user here. don't need all their info.
    return getPaginatedResult<Partial<User[]>>(this.baseUrl + 'admin/users-with-roles', params, this.http).pipe(
      map(paginatedResult => {
        // After we get the new result, set to FALSE so that the check above works. We set it to true on Update or Delete of information.
        this.usersModified = false;
        // now save the result to the membercache, passing a key of parameters from the search.
        this.usersWithRolesCache.set(Object.values(userManageParams).join('-'), paginatedResult);
        return paginatedResult;
      })
    );
  }

  updateUserRoles(username: string, roles: string[]) {
    // set usersModified to TRUE so that on getUsersWithRoles, it will reset the cache. Need to refetch from API because changes were made.
    this.usersModified = true;
    return this.http.post(this.baseUrl + 'admin/edit-roles/' + username + '?roles=' + roles, {});
  }


  deleteUser(username: string) {
    // set usersModified to TRUE so that on getUsersWithRoles, it will reset the cache. Need to refetch from API because changes were made.
    this.usersModified = true;
    return this.http.delete(this.baseUrl + 'admin/delete-user/' + username).pipe();
  }


  // methods for pagination involved in Admin Panel
  getUserManageParams() {
    return this.userManageParams;
  }

  setUserManageParams(params: UserManageParams) {
    this.userManageParams = params;
  }

  resetUserManageParams() {
    this.userManageParams = new UserManageParams();
    return this.userManageParams;
  }

  resetUsersWithRolesCache() {
    this.usersWithRolesCache = new Map();
  }


  // -------------MANAGE PHOTOS-----------------


  getPhotosForApproval(photoManageParams: PhotoManageParams) {
    if (this.photosModified === true) {
      this.photosForModerationCache = new Map();
    }

    const response = this.photosForModerationCache.get(Object.values(photoManageParams).join('-'));

    if (response) {
      return of(response);
    }

    let params = getPaginationHeaders(photoManageParams.pageNumber, photoManageParams.pageSize);

    // append any additional params here if need to later on
    // params = params.append('newParam', usrManageParams.aNewParam)

    photoManageParams.usernameSearch = photoManageParams.usernameSearch.trim().toLowerCase();
    params = params.append('usernameSearch', photoManageParams.usernameSearch.length <= 30
      ? photoManageParams.usernameSearch
      : photoManageParams.usernameSearch.substring(0, 30));
    params = params.append('state', photoManageParams.state);
    params = params.append('city', photoManageParams.city);
    params = params.append('orderBy', photoManageParams.orderBy);

    return getPaginatedResult<Photo[]>(this.baseUrl + 'admin/photos-to-moderate', params, this.http).pipe(
      map(paginatedResult => {
        // when we get a new result, set modified to FALSE
        this.photosModified = false;
        this.photosForModerationCache.set(Object.values(photoManageParams).join('-'), paginatedResult);
        return paginatedResult;
      })
    );
  }

  approvePhoto(photoId: number) {
    // set photosModified to TRUE so that on getPhotosForApproval,
    // it will reset the cache. Need to refetch from API because changes were made.
    this.photosModified = true;
    return this.http.post(this.baseUrl + 'admin/approve-photo/' + photoId, {});
  }

  rejectPhoto(photoId: number) {
    // set photosModified to TRUE so that on getPhotosForApproval,
    // it will reset the cache. Need to refetch from API because changes were made.
    this.photosModified = true;
    return this.http.post(this.baseUrl + 'admin/reject-photo/' + photoId, {});
  }

  // methods for photo pagination involved in Admin Panel
  getPhotoManageParams() {
    return this.photoManageParams;
  }

  setPhotoManageParams(params: PhotoManageParams) {
    this.photoManageParams = params;
  }

  resetPhotoManageParams() {
    this.photoManageParams = new PhotoManageParams();
    return this.photoManageParams;
  }

  resetPhotosForModerationCache() {
    this.photosForModerationCache = new Map();
  }
}

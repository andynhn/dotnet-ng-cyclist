import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Pagination } from 'src/app/_models/pagination';
import { Photo } from 'src/app/_models/photo';
import { PhotoManageParams } from 'src/app/_models/photoManageParams';
import { AdminService } from 'src/app/_services/admin.service';

@Component({
  selector: 'app-photo-management',
  templateUrl: './photo-management.component.html',
  styleUrls: ['./photo-management.component.css']
})
export class PhotoManagementComponent implements OnInit, OnDestroy {
  photos: Photo[];
  pagination: Pagination;
  photoManageParams: PhotoManageParams;
  states: object;
  cities: string[] = [];
  loading = false;
  selectedState = '';

  constructor(private adminService: AdminService,
              private toastr: ToastrService,
              private http: HttpClient) {
    // initialize to the photoManageParams variable from the service.
    this.photoManageParams = this.adminService.getPhotoManageParams();
   }

  ngOnInit(): void {
    this.getCityStates();
  }

  getCityStates(): any {
    // getPhotosForApproval also sets loading to true. That's needed for form submit.
    // Set to true here for onInit because it will take some time for cityStates.json to load.
    // May take longer than getPhotosForApproval, so set to false in getPhotosForApproval.
    this.loading = true;
    this.http.get('../../assets/cityStates.json').subscribe(data => {
      this.states = data;
      // call load member here so that city states json gets loaded in time. Form needs this data.
      this.getPhotosForApproval();
    });
  }

  getPhotosForApproval() {
    this.loading = true;
    // set to 1 here for when user makes a new search but while on a different page of an existing search
    // Pagination logic is set to skip (currentPage - 1 * pageSize) of the total query results.
    // If user makes new search while on a page > 1, pagination will have issues and return faulty data
    this.photoManageParams.pageNumber = 1;
    this.adminService.setPhotoManageParams(this.photoManageParams);
    this.adminService.getPhotosForApproval(this.photoManageParams).subscribe(response => {
      this.photos = response.result;
      this.pagination = response.pagination;
      this.loading = false;
    }, error => {
      console.log(error);
    });
  }

  pageChanged(event: any) {
    this.loading = true;
    this.photoManageParams.pageNumber = event.page;
    this.adminService.setPhotoManageParams(this.photoManageParams);
    this.adminService.getPhotosForApproval(this.photoManageParams).subscribe(response => {
      this.photos = response.result;
      this.pagination = response.pagination;
      this.loading = false;
    });
  }

  changeState(data) {
    if (!data) {
      // if no state selected, reset data that userParams.city relies on.
      this.selectedState = '';
      this.cities = [];
      this.photoManageParams.city = '';
    }
    if (data) {
      this.selectedState = data;
      this.cities = this.states[this.selectedState];
    }
  }

  /**
   * Approves a photo that a user uploaded. Then Removes it from the admin's photos for approval list.
   * 
   */
  approvePhoto(photoId) {
    this.loading = true;
    this.adminService.approvePhoto(photoId).subscribe(() => {
      // this.photos.splice(this.photos.findIndex(p => p.id === photoId), 1);
      // then get the updated list of photos.
      // TODO: Revisit Caching for this page (above). Find an efficient way to cache photos for approval, remove photos via approve/reject,
      // and update pagination to accurately reflect changes.
      this.adminService.resetPhotosForModerationCache();
      this.adminService.getPhotosForApproval(this.photoManageParams).subscribe(response => {
        this.photos = response.result;
        this.pagination = response.pagination;
        this.loading = false;
      });

      this.toastr.success('Photo approved');
    });
  }

  rejectPhoto(photoId) {
    this.loading = true;
    this.adminService.rejectPhoto(photoId).subscribe(() => {
      // this.photos.splice(this.photos.findIndex(p => p.id === photoId), 1);
      // Then get the updated list of photos
      // TODO: Revisit Caching for this page. Find an efficient way to cache photos for approval, remove photos via approve/reject,
      // and update pagination to accurately reflect changes.
      this.adminService.resetPhotosForModerationCache();
      this.adminService.getPhotosForApproval(this.photoManageParams).subscribe(response => {
        this.photos = response.result;
        this.pagination = response.pagination;
        this.loading = false;
      });

      this.toastr.warning('Photo rejected');
    });
  }

  resetFilters() {
    this.selectedState = '';
    this.photoManageParams = this.adminService.resetPhotoManageParams();
    this.getPhotosForApproval();
  }

  ngOnDestroy() {
    this.selectedState = '';
    // TODO: Revisit Caching for this page. Find an efficient way to cache photos for approval, remove photos via approve/reject,
    // and update pagination to accurately reflect changes.
    // this.adminService.resetPhotosForModerationCache();
    this.adminService.resetPhotoManageParams();
  }
}

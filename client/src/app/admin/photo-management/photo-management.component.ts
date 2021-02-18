import { Component, OnInit } from '@angular/core';
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
export class PhotoManagementComponent implements OnInit {
  photos: Photo[];
  pagination: Pagination;
  photoManageParams: PhotoManageParams;
  loading = false;

  constructor(private adminService: AdminService,
              private toastr: ToastrService) {
    // initialize to the photoManageParams variable from the service.
    this.photoManageParams = this.adminService.getPhotoManageParams();
   }

  ngOnInit(): void {
    this.getPhotosForApproval();
  }

  getPhotosForApproval() {
    this.loading = true;
    this.adminService.setPhotoManageParams(this.photoManageParams);
    this.adminService.getPhotosForApproval(this.photoManageParams).subscribe(response => {
      this.photos = response.result;
      this.pagination = response.pagination;
      console.log(response.result);
      this.loading = false;
    });
  }

  pageChanged(event: any) {
    console.log(event);
    this.photoManageParams.pageNumber = event.page;
    this.adminService.setPhotoManageParams(this.photoManageParams);
    this.getPhotosForApproval();
  }


  approvePhoto(photoId) {
    this.adminService.approvePhoto(photoId).subscribe(() => {
      // remove that photo from the list of photos that the admin has to approve.
      this.photos.splice(this.photos.findIndex(p => p.id === photoId), 1);
      this.toastr.success('Photo approved');
    });
  }

  rejectPhoto(photoId) {
    this.adminService.rejectPhoto(photoId).subscribe(() => {
      // remove that photo from the list of photos that the admin has to approve.
      this.photos.splice(this.photos.findIndex(p => p.id === photoId), 1);
      this.toastr.warning('Photo rejected');
    });
  }

}

import { Component, Input, OnInit } from '@angular/core';
import { FileUploader } from 'ng2-file-upload';
import { take } from 'rxjs/operators';
import { PreventUnsavedChangesGuard } from 'src/app/_guards/prevent-unsaved-changes.guard';
import { Member } from 'src/app/_models/member';
import { Photo } from 'src/app/_models/photo';
import { User } from 'src/app/_models/user';
import { AccountService } from 'src/app/_services/account.service';
import { MembersService } from 'src/app/_services/members.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-photo-editor',
  templateUrl: './photo-editor.component.html',
  styleUrls: ['./photo-editor.component.css']
})
export class PhotoEditorComponent implements OnInit {
  @Input() member: Member;
  uploader: FileUploader;
  hasBaseDropzoneOver = false;
  baseUrl = environment.apiUrl;
  user: User;

  constructor(private accountService: AccountService, private memberService: MembersService) {
    this.accountService.currentUser$.pipe(take(1)).subscribe(user => this.user = user);
  }

  ngOnInit(): void {
    this.initializeUploader();
  }

  setMainPhoto(photo: Photo) {
    this.memberService.setMainPhoto(photo.id).subscribe(() => {
      this.user.photoUrl = photo.url;
      // updates both our current user observable and our photo inside local storage.
      this.accountService.setCurrentUser(this.user);
      this.member.photoUrl = photo.url;
      this.member.photos.forEach(p => {
        if (p.isMain) {
          p.isMain = false;
        }
        if (p.id === photo.id) {
          p.isMain = true;
        }
      });
    });
  }

  deletePhoto(photoId: number) {
    // api call to delete photo
    this.memberService.deletePhoto(photoId).subscribe(() => {
      // returns an array of the photos not equal to the photo id we pass in. filter out the photo
      this.member.photos = this.member.photos.filter(x => x.id !== photoId);
    });
  }

  // sets our dropzone in the template
  fileOverBase(e: any) {
    this.hasBaseDropzoneOver = e;
  }

  initializeUploader() {
    this.uploader = new FileUploader({
      url: this.baseUrl + 'users/add-photo',
      authToken: 'Bearer ' + this.user.token,
      isHTML5: true,
      allowedFileType: ['image'],
      removeAfterUpload: true,
      autoUpload: false,
      maxFileSize: 10 * 1024 * 1024
    });
    // maxFileSize is 10 mb

    // specify waht to do after adding file.
    this.uploader.onAfterAddingFile = (file) => {
      file.withCredentials = false;
    };

    // after finishing the upload, add photo to the user's photos array.
    this.uploader.onSuccessItem = (item, response, status, headers) => {
      if (response) {
        const photo: Photo = JSON.parse(response);
        this.member.photos.push(photo);
        if (photo.isMain) {
          // now update the image everywhere (nav bar, member list, etc.)
          this.user.photoUrl = photo.url;
          this.member.photoUrl = photo.url;
          // saves the user item in localStorage and sets the next variable for currentUser$ obseravble.
          this.accountService.setCurrentUser(this.user);
        }
      }
    };
  }
}

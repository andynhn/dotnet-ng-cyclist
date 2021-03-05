import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxGalleryAnimation, NgxGalleryImage, NgxGalleryOptions } from '@kolkov/ngx-gallery';
import { TabDirective, TabsetComponent } from 'ngx-bootstrap/tabs';
import { ToastrService } from 'ngx-toastr';
import { take } from 'rxjs/operators';
import { Member } from 'src/app/_models/member';
import { Message } from 'src/app/_models/message';
import { User } from 'src/app/_models/user';
import { AccountService } from 'src/app/_services/account.service';
import { MembersService } from 'src/app/_services/members.service';
import { MessageService } from 'src/app/_services/message.service';
import { PresenceService } from 'src/app/_services/presence.service';

@Component({
  selector: 'app-member-detail',
  templateUrl: './member-detail.component.html',
  styleUrls: ['./member-detail.component.css']
})
export class MemberDetailComponent implements OnInit, OnDestroy {
  /*
    Access the #memberTabs tag that we specified in the HTML tabset.
    Static so that it does not react to component changes.
  */
  @ViewChild('memberTabs', {static: true}) memberTabs: TabsetComponent;
  member: Member;
  user: User;         // the current user
  galleryOptions: NgxGalleryOptions[];    // for displaying a photo gallery
  galleryImages: NgxGalleryImage[];       // for displaying a photo gallery
  activeTab: TabDirective;    // the active tab within the tabset
  messages: Message[] = [];   // array of messages

  // variables that help with HTML for loop that displays the user's selections for these categories.
  cyclingFrequency = ['daily', 'weekly', 'monthly'];
  cyclingCategory = ['road', 'gravel', 'mountain'];
  skillLevel = ['beginner', 'intermediate', 'advanced'];

  constructor(public presence: PresenceService, private route: ActivatedRoute,
              private messageService: MessageService,
              private accountService: AccountService,
              private router: Router,
              private memberService: MembersService,
              private toastr: ToastrService) {
                // initialize some variables here
                this.accountService.currentUser$.pipe(take(1)).subscribe(user => this.user = user); // get current user from AccountService
                this.router.routeReuseStrategy.shouldReuseRoute = () => false;    // set to false to prevent some routing issues
  }

  ngOnInit(): void {
    /*
      By using Router resolvers like this, we don't need to check "*ngIf='member'" on component load for the messages tab feature.
      We get the member data prior to the component being initialized, from the route. (see member-detailed.resolver.ts)
      make sure to remove any existing *ngIf conditionals when using this, otherwise, will cause errors.
      Need this for feature that directly accesses 'Messages' tab on profile load from the discover members component member cards.
    */
    this.route.data.subscribe(data => {
      // the api returns a member, if one exists. If not, it redirects to not found, skipping this logic.
      this.member = data.member; // guaranteed to have the member in the route
    });

    /*
      Determines which tab to route us to. If query params for tab is 3, go to messages tab.
      Specifically use this when we click on the message icon from the member card component within the discover members component.
    */
    this.route.queryParams.subscribe(params => {
      params.tab ? this.selectTab(params.tab) : this.selectTab(0);
    });

    // initialize the photo gallery that displays a member's photos.
    this.galleryOptions = [
      {
        width: '500px',
        height: '500px',
        imagePercent: 100,
        thumbnailsColumns: 4,
        imageAnimation: NgxGalleryAnimation.Slide,
        preview: false
      }
    ];

    this.galleryImages = this.getImages();
  }

  getImages(): NgxGalleryImage[] {
    const imageUrls = [];
    for (const photo of this.member.photos) {
      imageUrls.push({
        small: photo.url,
        medium: photo.url,
        big: photo.url
      });
    }
    return imageUrls;
  }

  /**
   * Method to make an API call to load the message thread. No longer used with Signal R chat hub.
   */
  loadMessages() {
    this.messageService.getMessageThread(this.member.username).subscribe(messages => {
      this.messages = messages;
    });
  }

  /**
   * Primary method for setting a tab's active property to true if it is clicked.
   */
  selectTab(tabId: number) {
    this.memberTabs.tabs[tabId].active = true;
    // in html, we hardcoded 3 to access the message tab. (tabs are like an index in the tabset array.)
  }

  /**
   * Primary method for getting messages for the 'Messages' tab, only if that tab is activated.
   */
  onTabActivated(data: TabDirective) {
    this.activeTab = data;
    if (this.activeTab.heading === 'Messages' && this.messages.length === 0) {
      this.messageService.createHubConnection(this.user, this.member.username);  // NOTE: this will update any null dateReads for messages.
    } else {
      this.messageService.stopHubConnection();             // stop the hub connection if they are not on that tab
    }
  }

  ngOnDestroy(): void {
    this.messageService.stopHubConnection();                // stop the hub connection if they leave the component
  }
}

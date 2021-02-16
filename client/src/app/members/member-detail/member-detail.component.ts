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
  // access the #memberTabs tag that we specified in the tabset in the html.
  // static so that it does not react to component changes
  @ViewChild('memberTabs', {static: true}) memberTabs: TabsetComponent;
  member: Member;
  galleryOptions: NgxGalleryOptions[];
  galleryImages: NgxGalleryImage[];
  activeTab: TabDirective;
  messages: Message[] = [];
  user: User;
  cyclingFrequency = ['daily', 'weekly', 'monthly'];
  cyclingCategory = ['road', 'gravel', 'mountain'];
  skillLevel = ['beginner', 'intermediate', 'advanced'];

  constructor(public presence: PresenceService, private route: ActivatedRoute,
              private messageService: MessageService,
              private accountService: AccountService,
              private router: Router,
              private memberService: MembersService,
              private toastr: ToastrService) {
    this.accountService.currentUser$.pipe(take(1)).subscribe(user => this.user = user);
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
  }

  ngOnInit(): void {
    // by using Router resolvers like this, we don't need to check "*ngIf='member'" exists on component load for the messages tab feature.
    // we get the member data prior to the component being initialized, from the route. (see member-detailed.resolver.ts)
    // make sure to remove that *ngIf conditional when using this, otherwise, will cause errors.
    // need this for feature that directly accesses Message tab on profile load.
    this.route.data.subscribe(data => {
      this.member = data.member; // guaranteed to have the member in the route
    });

    // determines which tab to route us to. if query params for tab is 3, go to messages tab.
    // specifically use this when we click on the message icon from the member card component.
    this.route.queryParams.subscribe(params => {
      params.tab ? this.selectTab(params.tab) : this.selectTab(0);
    });

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

  loadMessages() {
    this.messageService.getMessageThread(this.member.username).subscribe(messages => {
      this.messages = messages;
    });
  }

  selectTab(tabId: number) {
    this.memberTabs.tabs[tabId].active = true;
    // in html, we hardcoded 3 to access the message tab. (tabs are like an index in the tabset array.)
  }

  // method that helps get messages only when that tab is activated
  onTabActivated(data: TabDirective) {
    this.activeTab = data;
    if (this.activeTab.heading === 'Messages' && this.messages.length === 0) {
      this.messageService.createHubConnection(this.user, this.member.username);
      // createHubConnection will update any null dateReads for messages.
      // the messageThread$ observable should have the updated list with the updated messages
    } else {
      // stop the hub connection if they are not on that tab
      this.messageService.stopHubConnection();
    }
  }

  ngOnDestroy(): void {
    // stop the hub connection if they leave the component
    this.messageService.stopHubConnection();
  }
}

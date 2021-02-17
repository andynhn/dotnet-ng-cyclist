import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SharedModule } from './_modules/shared.module';
import { HomeComponent } from './home/home.component';
import { NavComponent } from './nav/nav.component';
import { AdminPanelComponent } from './admin/admin-panel/admin-panel.component';
import { PhotoManagementComponent } from './admin/photo-management/photo-management.component';
import { UserManagementComponent } from './admin/user-management/user-management.component';
import { NotFoundComponent } from './errors/not-found/not-found.component';
import { ServerErrorComponent } from './errors/server-error/server-error.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { HasRoleDirective } from './_directives/has-role.directive';
import { RegisterComponent } from './register/register.component';
import { ErrorInterceptor } from './_interceptors/error.interceptor';
import { JwtInterceptor } from './_interceptors/jwt.interceptor';
import { LoadingInterceptor } from './_interceptors/loading.interceptor';
import { DateInputComponent } from './_forms/date-input/date-input.component';
import { TextInputComponent } from './_forms/text-input/text-input.component';
import { ChatComponent } from './chat/chat.component';
import { MemberCardComponent } from './members/member-card/member-card.component';
import { DiscoverMembersComponent } from './members/discover-members/discover-members.component';
import { MemberEditComponent } from './members/member-edit/member-edit.component';
import { MemberDetailComponent } from './members/member-detail/member-detail.component';
import { RolesModalComponent } from './modals/roles-modal/roles-modal.component';
import { ConfirmDialogComponent } from './modals/confirm-dialog/confirm-dialog.component';
import { PhotoEditorComponent } from './members/photo-editor/photo-editor.component';
import { MemberMessagesComponent } from './members/member-messages/member-messages.component';
import { MemberEditCredentialsComponent } from './members/member-edit-credentials/member-edit-credentials.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NavComponent,
    AdminPanelComponent,
    PhotoManagementComponent,
    UserManagementComponent,
    NotFoundComponent,
    ServerErrorComponent,
    LandingPageComponent,
    HasRoleDirective,
    RegisterComponent,
    DateInputComponent,
    TextInputComponent,
    ChatComponent,
    MemberCardComponent,
    DiscoverMembersComponent,
    MemberEditComponent,
    MemberDetailComponent,
    RolesModalComponent,
    ConfirmDialogComponent,
    PhotoEditorComponent,
    MemberMessagesComponent,
    MemberEditCredentialsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    FormsModule,
    SharedModule, // shared module contains additional imports, etc. to help keep this file clean.
    ReactiveFormsModule
  ],
  providers: [
    // this adds our error interceptor to the existing http interceptors in angular.
    // multi as true because we want to ADD and not replace the existing interceptors.
    {provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

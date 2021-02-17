import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminPanelComponent } from './admin/admin-panel/admin-panel.component';
import { ChatComponent } from './chat/chat.component';
import { NotFoundComponent } from './errors/not-found/not-found.component';
import { ServerErrorComponent } from './errors/server-error/server-error.component';
import { HomeComponent } from './home/home.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { DiscoverMembersComponent } from './members/discover-members/discover-members.component';
import { MemberDetailComponent } from './members/member-detail/member-detail.component';
import { MemberEditCredentialsComponent } from './members/member-edit-credentials/member-edit-credentials.component';
import { MemberEditComponent } from './members/member-edit/member-edit.component';
import { AdminGuard } from './_guards/admin.guard';
import { AuthGuard } from './_guards/auth.guard';
import { PreventUnsavedChangesGuard } from './_guards/prevent-unsaved-changes.guard';
import { MemberDetailResolver } from './_resolvers/member-detail.resolver';

const routes: Routes = [
  // LandingPageComponent is our public unprotected route
  { path: '', component: LandingPageComponent },
  // routes nested here are protected via Angular Guards.
  {
    path: '',
    runGuardsAndResolvers: 'always',
    canActivate: [AuthGuard],
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'discover', component: DiscoverMembersComponent },
      { path: 'members/:username', component: MemberDetailComponent, resolve: {member: MemberDetailResolver} },
      { path: 'member/edit', component: MemberEditComponent, canDeactivate: [PreventUnsavedChangesGuard] },
      { path: 'member/edit-credentials', component: MemberEditCredentialsComponent },
      { path: 'chat', component: ChatComponent },
      // add new paths that need need Auth protection within this children node.
      { path: 'admin', component: AdminPanelComponent, canActivate: [AdminGuard]}
    ]
  },
  { path: 'not-found', component: NotFoundComponent },
  { path: 'server-error', component: ServerErrorComponent },
  { path: '**', component: NotFoundComponent, pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

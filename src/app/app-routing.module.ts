import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './account/login/login.component';
import { ManageComponent } from './account/manage/manage.component';
import { SubscribeComponent } from './account/subscribe/subscribe.component';
import { AcceptInviteComponent } from './account/accept-invite/accept-invite.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'subscribe', component: SubscribeComponent },
  { path: 'manage', component: ManageComponent },
  { path: 'accept-invite', component: AcceptInviteComponent },
  { path: '', redirectTo: 'manage', pathMatch: 'full' },
  { path: '**', redirectTo: 'manage' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

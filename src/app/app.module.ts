import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { MaterialModule } from './material.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './account/login/login.component';
import { SubscribeComponent } from './account/subscribe/subscribe.component';
import { ManageComponent } from './account/manage/manage.component';
import { AcceptInviteComponent } from './account/accept-invite/accept-invite.component';
import { TokenInterceptor } from './code/helpers/interceptor';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SubscribeComponent,
    ManageComponent,
    AcceptInviteComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    MaterialModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

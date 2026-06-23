import { ApplicationRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticatedDto } from './code/models/shared/AuthenticatedDto';
import { AppBridgeService } from './code/services/app-bridge.service';
import { AppLanguage, TranslateService } from './code/services/translate.service';
import { UserService } from './code/services/user.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  isLoggedIn = false;

  constructor(
    private userService: UserService,
    public translateService: TranslateService,
    private appBridge: AppBridgeService,
    private router: Router,
    private appRef: ApplicationRef) { }

  ngOnInit(): void {
    this.translateService.initializeLanguage();
    this.translateService.languageLoaded.subscribe(loaded => {
      if (loaded) {
        this.appRef.tick();
      }
    });

    // Capture the native-app marker (`?from=app`) before the router strips it,
    // so we can deep-link back to the app after a confirmed subscription.
    this.appBridge.captureReturnFlag();

    // Restore an existing session so a page refresh keeps the user logged in.
    const stored = localStorage.getItem(UserService.UserLocalStorageKey);
    if (stored) {
      try {
        const dto: AuthenticatedDto = JSON.parse(stored);
        if (dto && dto.id) {
          this.userService.loggedUser.next(dto);
          this.userService.$authenticated.next(true);
        }
      } catch {
        localStorage.removeItem(UserService.UserLocalStorageKey);
      }
    }

    this.userService.$authenticated.subscribe(res => this.isLoggedIn = res);
  }

  logout(): void {
    localStorage.removeItem(UserService.UserLocalStorageKey);
    this.userService.loggedUser.next(undefined);
    this.userService.$authenticated.next(false);
    this.router.navigate(['/login']);
  }

  setLanguage(lang: AppLanguage): void {
    this.translateService.setLanguage(lang);
  }
}

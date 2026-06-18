import { AfterViewInit, Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticatedDto, AuthenticationDto } from 'src/app/code/models/shared/AuthenticatedDto';
import { GoogleLoaderService } from 'src/app/code/services/google-loader.service';
import { TranslateService } from 'src/app/code/services/translate.service';
import { UserService } from 'src/app/code/services/user.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-account-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, AfterViewInit {
  loading = false;
  hasError = false;
  googleEnabled = false;
  googleError = false;
  formGroup!: FormGroup;

  @ViewChild('googleBtn') googleBtn?: ElementRef<HTMLDivElement>;

  constructor(
    public translateService: TranslateService,
    private userService: UserService,
    private googleLoader: GoogleLoaderService,
    private zone: NgZone,
    private route: ActivatedRoute,
    public router: Router) { }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required])
    });
    this.googleEnabled = this.googleLoader.isConfigured();
  }

  ngAfterViewInit(): void {
    if (!this.googleEnabled) {
      return;
    }
    this.initGoogle();
  }

  private initGoogle(): void {
    this.googleLoader.load()
      .then(google => {
        google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (response: any) => this.handleCredential(response)
        });
        if (this.googleBtn?.nativeElement) {
          google.accounts.id.renderButton(this.googleBtn.nativeElement, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            logo_alignment: 'left',
            width: 320
          });
        }
      })
      .catch(() => {
        this.googleError = true;
      });
  }

  private handleCredential(response: any): void {
    const token = response?.credential;
    if (!token) {
      this.zone.run(() => { this.googleError = true; });
      return;
    }

    const profile = this.decodeJwt(token);
    if (!profile || !profile.email) {
      this.zone.run(() => { this.googleError = true; });
      return;
    }

    const payload = {
      email: profile.email,
      name: profile.given_name || profile.name || profile.email,
      lastName: profile.family_name || '',
      isSocial: true,
      socialProvider: 'google',
      // Social users have no birth date from Google; send a SQL-valid placeholder so
      // first-time account creation does not fail on the non-nullable BirthDate column.
      birthDate: '1970-01-01T00:00:00.000Z'
    };

    this.zone.run(() => {
      this.loading = true;
      this.hasError = false;
      this.googleError = false;

      this.userService.authenticateSocial(payload).subscribe({
        next: (res: AuthenticatedDto) => {
          localStorage.setItem(UserService.UserLocalStorageKey, JSON.stringify(res));
          this.userService.$authenticated.next(true);
          this.userService.loggedUser.next(res);
          this.loading = false;

          const returnTo = this.route.snapshot.queryParamMap.get('returnUrl') || '/manage';
          this.router.navigateByUrl(returnTo);
        },
        error: () => {
          this.loading = false;
          this.googleError = true;
        }
      });
    });
  }

  private decodeJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  async login(): Promise<void> {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.hasError = false;

    const authDto = new AuthenticationDto();
    authDto.email = this.formGroup.controls['email'].value;
    authDto.password = this.formGroup.controls['password'].value;

    (await this.userService.authenticate(authDto)).subscribe({
      next: (res: AuthenticatedDto) => {
        localStorage.setItem(UserService.UserLocalStorageKey, JSON.stringify(res));
        this.userService.$authenticated.next(true);
        this.userService.loggedUser.next(res);
        this.loading = false;

        const returnTo = this.route.snapshot.queryParamMap.get('returnUrl') || '/manage';
        this.router.navigateByUrl(returnTo);
      },
      error: () => {
        this.loading = false;
        this.hasError = true;
      }
    });
  }
}

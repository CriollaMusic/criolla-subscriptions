import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BaseService } from './base-service';
import { environment } from 'src/environments/environment';
import { User } from '../models/Entity/user';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthenticatedDto, AuthenticationDto } from '../models/shared/AuthenticatedDto';

@Injectable({
  providedIn: 'root'
})
export class UserService extends BaseService<User> {

  private user!: AuthenticatedDto | undefined;
  static UserLocalStorageKey = 'CWAK';
  $authenticated = new BehaviorSubject<boolean>(false);
  loggedUser = new BehaviorSubject<AuthenticatedDto | undefined>(new AuthenticatedDto());

  constructor(private http: HttpClient) {
    super(http, environment.userApi, 'User');
    this.loggedUser.subscribe(res => this.user = res);
  }

  public CurrentUserToken(): string {
    return this.user?.token?.value ?? '';
  }

  async authenticate(authentication: AuthenticationDto): Promise<Observable<AuthenticatedDto>> {
    await this.setIpAddress(authentication);
    return this.http.post<AuthenticatedDto>(`${environment.userApi}User/authenticate`, authentication);
  }

  /**
   * Authenticates (or registers, server-side) a user from a social provider such as Google.
   * The backend finds-or-creates the account by email and returns a session token.
   * POST /User/authenticateSocial
   */
  authenticateSocial(payload: any): Observable<AuthenticatedDto> {
    return this.http.post<AuthenticatedDto>(`${environment.userApi}User/authenticateSocial`, payload);
  }

  private async setIpAddress(authentication: AuthenticationDto) {
    try {
      await this.http.get("https://api.ipify.org?format=json").toPromise().then((res: any) => {
        authentication.ipAddress = res.ip;
      });
    }
    catch (err) {
      authentication.ipAddress = "0.0.0.0";
    }
  }

}

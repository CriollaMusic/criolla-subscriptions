import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AlertItem } from '../helpers/AlertItem';
import { UserService } from '../services/user.service';
import { AuthenticatedDto } from '../models/shared/AuthenticatedDto';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  user: AuthenticatedDto | undefined;
  alertItem: AlertItem;
  constructor(
    public router: Router,
    private userService: UserService
  ) {
    this.userService.loggedUser.subscribe(res => this.user = res);
    this.alertItem = new AlertItem();
  }

  showErrorAlertItem(msj: string): Promise<any> {
    this.alertItem.type = 'error';
    this.alertItem.title = 'Error';
    this.alertItem.timer = 3000;
    this.alertItem.text = msj;
    return this.alertItem.Show();
  }

  errorMethod = (error: HttpErrorResponse) => {
    if (error.status === 401) {
      this.showErrorAlertItem("Usuario no autenticado.").then(() => {
        this.router.navigate(['/login']);
      });
    }
    return throwError(() => error);
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let value = this.user ? this.user.token?.value : '';
    let modifiedReq = req.clone({
      headers: req.headers.set('token', `${value}`),
    });

    return next.handle(modifiedReq).pipe(catchError(this.errorMethod));
  }
}

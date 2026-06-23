import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface PaymentMethod {
  id: number;
  userId: number;
  type: string;
  brand: string;
  lastFourDigits: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  status: string;
}

export interface SetupTokenResponse {
  setupTokenId: string;
  clientId: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentMethodService {

  private readonly baseUrl = `${environment.userApi}PaymentMethod`;

  constructor(private http: HttpClient) { }

  createSetupToken(): Observable<SetupTokenResponse> {
    return this.http.post<SetupTokenResponse>(`${this.baseUrl}/setup-token`, {});
  }

  savePaymentMethod(userId: number, setupTokenId: string, setAsDefault = true): Observable<PaymentMethod> {
    return this.http.post<PaymentMethod>(`${this.baseUrl}/save`, {
      userId,
      setupTokenId,
      setAsDefault
    });
  }

  getUserPaymentMethods(userId: number): Observable<Array<PaymentMethod>> {
    return this.http.get<Array<PaymentMethod>>(`${this.baseUrl}/user/${userId}`);
  }
}

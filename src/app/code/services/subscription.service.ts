import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SubscriptionPlan } from '../models/Entity/subscriptionPlan';
import { Subscription } from '../models/Entity/subscription';
import { PaymentHistory } from '../models/Entity/paymentHistory';
import { BaseService } from './base-service';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService extends BaseService<Subscription> {
  constructor(private http: HttpClient) {
    super(http, environment.userApi, 'Subscription');
  }

  getPlans(): Observable<Array<SubscriptionPlan>> {
    return this.http.get<Array<SubscriptionPlan>>(`${environment.userApi}Subscription/plans`);
  }

  getPlanById(planId: number): Observable<SubscriptionPlan> {
    return this.http.get<SubscriptionPlan>(`${environment.userApi}Subscription/plan/${planId}`);
  }

  getUserSubscription(userId: number): Observable<Subscription> {
    return this.http.get<Subscription>(`${environment.userApi}Subscription/user/${userId}`);
  }

  getPaymentHistory(userId: number): Observable<Array<PaymentHistory>> {
    return this.http.get<Array<PaymentHistory>>(`${environment.userApi}Subscription/payments/${userId}`);
  }

  cancel(userId: number, reason: string): Observable<any> {
    return this.http.post(`${environment.userApi}Subscription/cancel`, { userId, reason });
  }

  reactivate(userId: number): Observable<any> {
    return this.http.post(`${environment.userApi}Subscription/reactivate`, { userId });
  }

  /**
   * Records a subscription approved client-side via the PayPal JS SDK (smart buttons).
   * POST /Subscription/web-subscribe
   */
  webSubscribe(userId: number, planId: number, subscriptionId: string): Observable<Subscription> {
    return this.http.post<Subscription>(`${environment.userApi}Subscription/web-subscribe`, {
      userId,
      planId,
      subscriptionId
    });
  }
}

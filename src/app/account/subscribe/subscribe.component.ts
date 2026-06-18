import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertItem } from 'src/app/code/helpers/AlertItem';
import { SubscriptionPlan } from 'src/app/code/models/Entity/subscriptionPlan';
import { AppBridgeService } from 'src/app/code/services/app-bridge.service';
import { PaypalLoaderService } from 'src/app/code/services/paypal-loader.service';
import { SubscriptionService } from 'src/app/code/services/subscription.service';
import { TranslateService } from 'src/app/code/services/translate.service';
import { UserService } from 'src/app/code/services/user.service';

@Component({
  selector: 'app-account-subscribe',
  templateUrl: './subscribe.component.html',
  styleUrls: ['./subscribe.component.css']
})
export class SubscribeComponent implements OnInit, AfterViewInit {

  loading = false;
  paypalError = false;
  plans: Array<SubscriptionPlan> = new Array<SubscriptionPlan>();
  private rendered = false;

  constructor(
    private subscriptionService: SubscriptionService,
    private paypalLoader: PaypalLoaderService,
    private userService: UserService,
    private appBridge: AppBridgeService,
    public translateService: TranslateService,
    private router: Router) { }

  ngOnInit(): void {
    const user = this.userService.loggedUser.value;
    if (!user || !user.id) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/subscribe' } });
      return;
    }

    this.loading = true;
    this.subscriptionService.getPlans().subscribe({
      next: (res: Array<SubscriptionPlan>) => {
        this.plans = (res || []).filter(p => p.isActive);
        this.loading = false;
        this.tryRenderButtons();
      },
      error: () => {
        this.plans = [];
        this.loading = false;
      }
    });
  }

  ngAfterViewInit(): void {
    this.tryRenderButtons();
  }

  private tryRenderButtons(): void {
    if (this.rendered || this.plans.length === 0) {
      return;
    }
    this.rendered = true;

    this.paypalLoader.load().then((paypal: any) => {
      // Wait a tick so the *ngFor containers exist in the DOM
      setTimeout(() => {
        this.plans.forEach(plan => this.renderButton(paypal, plan));
      }, 0);
    }).catch(() => {
      this.paypalError = true;
    });
  }

  private renderButton(paypal: any, plan: SubscriptionPlan): void {
    if (!plan.payPalPlanId) {
      return;
    }

    const containerId = `paypal-button-${plan.id}`;
    const container = document.getElementById(containerId);
    if (!container) {
      return;
    }

    paypal.Buttons({
      style: { layout: 'vertical', shape: 'pill', label: 'subscribe' },
      createSubscription: (_data: any, actions: any) => {
        return actions.subscription.create({ plan_id: plan.payPalPlanId });
      },
      onApprove: (data: any) => {
        this.onApproved(plan, data.subscriptionID);
      },
      onError: () => {
        this.paypalError = true;
      }
    }).render(`#${containerId}`);
  }

  private onApproved(plan: SubscriptionPlan, subscriptionId: string): void {
    const user = this.userService.loggedUser.value;
    if (!user || !user.id) {
      return;
    }

    this.loading = true;
    this.subscriptionService.webSubscribe(user.id, plan.id, subscriptionId).subscribe({
      next: () => {
        this.loading = false;
        const alert = new AlertItem();
        alert.type = 'success';
        alert.text = this.translateService.getText('account.subscribe.success');
        alert.Show().then(() => {
          // If the user came from the native app, hand control back to it so it
          // relaunches and refreshes the subscription; otherwise stay on the web.
          if (!this.appBridge.returnToApp(subscriptionId)) {
            this.router.navigate(['/manage']);
          }
        });
      },
      error: () => {
        this.loading = false;
        const alert = new AlertItem();
        alert.type = 'error';
        alert.text = this.translateService.getText('account.subscribe.error');
        alert.Show();
      }
    });
  }
}

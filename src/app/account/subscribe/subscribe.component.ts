import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';

import { firstValueFrom } from 'rxjs';

import { AlertItem } from 'src/app/code/helpers/AlertItem';

import { SubscriptionPlan } from 'src/app/code/models/Entity/subscriptionPlan';

import { AppBridgeService } from 'src/app/code/services/app-bridge.service';

import { OnvoLoaderService } from 'src/app/code/services/onvo-loader.service';

import { PaypalLoaderService } from 'src/app/code/services/paypal-loader.service';

import { SubscriptionService } from 'src/app/code/services/subscription.service';

import { TranslateService } from 'src/app/code/services/translate.service';

import { UserService } from 'src/app/code/services/user.service';



@Component({

  selector: 'app-account-subscribe',

  templateUrl: './subscribe.component.html',

  styleUrls: ['./subscribe.component.css']

})

export class SubscribeComponent implements OnInit {



  loading = false;

  paymentError = false;

  plans: Array<SubscriptionPlan> = new Array<SubscriptionPlan>();

  highlightedPlanId: number | null = null;



  selectedPlan: SubscriptionPlan | null = null;

  paymentLoading = false;

  checkoutProvider: 'onvo' | 'paypal' | null = null;



  constructor(

    private subscriptionService: SubscriptionService,

    private paypalLoader: PaypalLoaderService,

    private onvoLoader: OnvoLoaderService,

    private userService: UserService,

    private appBridge: AppBridgeService,

    public translateService: TranslateService,

    private router: Router,

    private route: ActivatedRoute,

    private cdr: ChangeDetectorRef) { }



  ngOnInit(): void {

    const user = this.userService.loggedUser.value;

    if (!user || !user.id) {

      const returnUrl = this.route.snapshot.queryParamMap.get('planId')

        ? `/subscribe?planId=${this.route.snapshot.queryParamMap.get('planId')}`

        : '/subscribe';

      this.router.navigate(['/login'], { queryParams: { returnUrl } });

      return;

    }



    const planIdParam = this.route.snapshot.queryParamMap.get('planId');

    if (planIdParam) {

      const parsed = Number(planIdParam);

      if (!Number.isNaN(parsed)) {

        this.highlightedPlanId = parsed;

      }

    }



    this.loading = true;

    this.subscriptionService.getPlans().subscribe({

      next: (res: Array<SubscriptionPlan>) => {

        this.plans = (res || []).filter(p => p.isActive);

        if (this.highlightedPlanId) {

          this.plans.sort((a, b) => {

            if (a.id === this.highlightedPlanId) return -1;

            if (b.id === this.highlightedPlanId) return 1;

            return (a.displayOrder || 0) - (b.displayOrder || 0);

          });

        }

        this.loading = false;

        this.scrollToHighlightedPlan();



        if (this.highlightedPlanId) {

          const plan = this.plans.find(p => p.id === this.highlightedPlanId);

          if (plan) {

            setTimeout(() => this.openPaymentModal(plan), 350);

          }

        }

      },

      error: () => {

        this.plans = [];

        this.loading = false;

      }

    });

  }



  isHighlighted(plan: SubscriptionPlan): boolean {

    return this.highlightedPlanId != null && plan.id === this.highlightedPlanId;

  }



  usesOnvo(plan: SubscriptionPlan): boolean {

    const provider = (plan.paymentProvider || 'PAYPAL').toUpperCase();

    if (!plan.onvoPriceId) {

      return false;

    }

    return provider === 'ONVO' || provider === 'BOTH';

  }



  usesPayPal(plan: SubscriptionPlan): boolean {

    if (!plan.payPalPlanId) {

      return false;

    }

    const provider = (plan.paymentProvider || 'PAYPAL').toUpperCase();

    if (provider === 'PAYPAL') {

      return true;

    }

    if (provider === 'BOTH') {

      return !!plan.payPalPlanId;

    }

    return false;

  }



  isPlanAvailable(plan: SubscriptionPlan): boolean {

    return this.usesOnvo(plan) || this.usesPayPal(plan);

  }

  supportsBothProviders(plan: SubscriptionPlan): boolean {
    return (plan.paymentProvider || '').toUpperCase() === 'BOTH'
      && !!plan.onvoPriceId
      && !!plan.payPalPlanId;
  }

  get showProviderChoice(): boolean {
    return !!this.selectedPlan && this.supportsBothProviders(this.selectedPlan) && !this.checkoutProvider;
  }

  selectProvider(provider: 'onvo' | 'paypal'): void {
    this.checkoutProvider = provider;
    this.paymentError = false;
    this.cdr.detectChanges();
    void this.loadPaymentButtons();
  }



  openPaymentModal(plan: SubscriptionPlan): void {

    if (!this.isPlanAvailable(plan)) {

      return;

    }



    this.selectedPlan = plan;

    this.highlightedPlanId = plan.id;

    this.paymentError = false;

    this.checkoutProvider = this.supportsBothProviders(plan)
      ? null
      : (this.usesOnvo(plan) ? 'onvo' : 'paypal');

    document.body.style.overflow = 'hidden';

    this.cdr.detectChanges();

    if (this.checkoutProvider) {
      void this.loadPaymentButtons();
    }

  }



  closePaymentModal(): void {

    this.clearPaymentContainers();

    this.selectedPlan = null;

    this.checkoutProvider = null;

    this.paymentLoading = false;

    document.body.style.overflow = '';

    this.cdr.detectChanges();

  }



  private scrollToHighlightedPlan(): void {

    if (!this.highlightedPlanId) {

      return;

    }

    setTimeout(() => {

      const el = document.getElementById(`plan-card-${this.highlightedPlanId}`);

      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    }, 300);

  }



  private async loadPaymentButtons(): Promise<void> {

    if (!this.selectedPlan || !this.checkoutProvider) {

      return;

    }



    this.paymentLoading = true;

    this.clearPaymentContainers();

    this.cdr.detectChanges();



    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));



    if (!this.selectedPlan) {

      this.paymentLoading = false;

      this.cdr.detectChanges();

      return;

    }



    try {

      if (this.checkoutProvider === 'onvo') {

        await this.loadOnvoCheckout(this.selectedPlan);

      } else {

        await this.loadPayPalCheckout(this.selectedPlan);

      }

    } catch {

      this.paymentError = true;

    } finally {

      this.paymentLoading = false;

      this.cdr.detectChanges();

    }

  }



  private async loadOnvoCheckout(plan: SubscriptionPlan): Promise<void> {

    const user = this.userService.loggedUser.value;

    if (!user?.id) {

      throw new Error('User not logged in');

    }



    const session = await firstValueFrom(

      this.subscriptionService.createOnvoSession(user.id, plan.id));



    const onvo = await this.onvoLoader.load();

    const container = document.getElementById('onvo-checkout-container');

    if (!container) {

      throw new Error('ONVO checkout container not found');

    }

    container.innerHTML = '';



    onvo.pay({

      publicKey: session.publishableKey,

      subscriptionId: session.subscriptionId,

      customerId: session.customerId,

      paymentType: 'subscription',

      locale: this.translateService.onvoLocale,

      onSuccess: () => this.onOnvoSubscriptionApproved(plan, session.subscriptionId),

      onError: () => {

        this.paymentError = true;

        this.cdr.detectChanges();

      }

    }).render('#onvo-checkout-container');

  }



  private async loadPayPalCheckout(plan: SubscriptionPlan): Promise<void> {

    const paypal = await this.paypalLoader.load();

    if (!this.selectedPlan) {

      return;

    }

    this.renderSubscriptionButton(paypal, plan, 'modal-paypal-button', paypal.FUNDING?.PAYPAL);

    this.renderSubscriptionButton(paypal, plan, 'modal-card-button', paypal.FUNDING?.CARD);

  }



  private clearPaymentContainers(): void {

    ['modal-paypal-button', 'modal-card-button', 'onvo-checkout-container'].forEach(id => {

      const el = document.getElementById(id);

      if (el) {

        el.innerHTML = '';

      }

    });

  }



  /** PayPal Subscriptions — wallet or card via PayPal hosted checkout. */

  private renderSubscriptionButton(

    paypal: any, plan: SubscriptionPlan, containerId: string, fundingSource?: string): void {

    if (!plan.payPalPlanId || !paypal?.Buttons) {

      return;

    }



    const container = document.getElementById(containerId);

    if (!container) {

      return;

    }



    container.innerHTML = '';



    const isCard = fundingSource === paypal.FUNDING?.CARD;

    const buttonConfig: any = {

      style: {

        layout: 'vertical',

        shape: isCard ? 'rect' : 'pill',

        label: isCard ? 'pay' : 'subscribe',

        color: isCard ? 'black' : 'gold'

      },

      createSubscription: (_data: any, actions: any) => {

        return actions.subscription.create({ plan_id: plan.payPalPlanId });

      },

      onApprove: (data: any) => {

        this.onPayPalSubscriptionApproved(plan, data.subscriptionID);

      },

      onError: () => {

        this.paymentError = true;

        this.cdr.detectChanges();

      }

    };



    if (fundingSource) {

      buttonConfig.fundingSource = fundingSource;

    }



    paypal.Buttons(buttonConfig).render(`#${containerId}`).catch(() => {

      if (isCard) {

        container.innerHTML = '';

      }

    });

  }



  private onPayPalSubscriptionApproved(plan: SubscriptionPlan, subscriptionId: string): void {

    const user = this.userService.loggedUser.value;

    if (!user || !user.id) {

      return;

    }



    this.loading = true;

    this.subscriptionService.webSubscribe(user.id, plan.id, subscriptionId).subscribe({

      next: () => {

        this.loading = false;

        this.closePaymentModal();

        this.showSuccessAndReturn(subscriptionId);

      },

      error: () => {

        this.loading = false;

        this.showError();

      }

    });

  }



  private onOnvoSubscriptionApproved(plan: SubscriptionPlan, subscriptionId: string): void {

    const user = this.userService.loggedUser.value;

    if (!user || !user.id) {

      return;

    }



    this.loading = true;

    this.subscriptionService.onvoWebSubscribe(user.id, plan.id, subscriptionId).subscribe({

      next: () => {

        this.loading = false;

        this.closePaymentModal();

        this.showSuccessAndReturn(subscriptionId);

      },

      error: () => {

        this.loading = false;

        this.showError();

      }

    });

  }



  private showSuccessAndReturn(subscriptionId: string): void {

    const alert = new AlertItem();

    alert.type = 'success';

    alert.text = this.translateService.getText('account.subscribe.success');

    alert.Show().then(() => {

      if (!this.appBridge.returnToApp(subscriptionId)) {

        this.router.navigate(['/manage']);

      }

    });

  }



  private showError(message?: string): void {

    const alert = new AlertItem();

    alert.type = 'error';

    alert.text = message || this.translateService.getText('account.subscribe.error');

    alert.Show();

  }

}


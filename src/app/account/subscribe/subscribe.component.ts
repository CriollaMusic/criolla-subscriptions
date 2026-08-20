import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';

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

import { environment } from 'src/environments/environment';



@Component({

  selector: 'app-account-subscribe',

  templateUrl: './subscribe.component.html',

  styleUrls: ['./subscribe.component.css']

})

export class SubscribeComponent implements OnInit {



  loading = false;

  paymentError = false;
  paymentErrorMessage = '';
  confirmingPayment = false;
  private confirmPollCancelled = false;

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

    private ngZone: NgZone,

    private cdr: ChangeDetectorRef) { }



  ngOnInit(): void {

    const user = this.userService.loggedUser.value;

    if (!user || !user.id) {

      const params = new URLSearchParams();
      this.route.snapshot.queryParamMap.keys.forEach(key => {
        const value = this.route.snapshot.queryParamMap.get(key);
        if (value) {
          params.set(key, value);
        }
      });
      const returnUrl = params.toString() ? `/subscribe?${params.toString()}` : '/subscribe';

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

        const onvoSid = this.route.snapshot.queryParamMap.get('sid');
        if (this.route.snapshot.queryParamMap.get('onvo') === '3ds' && onvoSid) {
          const plan = this.plans.find(p => p.id === this.highlightedPlanId) || this.plans[0];
          if (plan) {
            this.onOnvoSubscriptionApproved(plan, onvoSid);
          }
          return;
        }

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



  get paypalEnabled(): boolean {
    return !!environment.paypalEnabled;
  }

  usesPayPal(plan: SubscriptionPlan): boolean {

    if (!this.paypalEnabled || !plan.payPalPlanId) {

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
    return this.paypalEnabled
      && (plan.paymentProvider || '').toUpperCase() === 'BOTH'
      && !!plan.onvoPriceId
      && !!plan.payPalPlanId;
  }

  get showProviderChoice(): boolean {
    return !!this.selectedPlan && this.supportsBothProviders(this.selectedPlan) && !this.checkoutProvider;
  }

  selectProvider(provider: 'onvo' | 'paypal'): void {
    if (provider === 'paypal' && !this.paypalEnabled) {
      return;
    }
    this.checkoutProvider = provider;
    this.clearPaymentError();
    this.cdr.detectChanges();
    void this.loadPaymentButtons();
  }



  openPaymentModal(plan: SubscriptionPlan): void {

    if (!this.isPlanAvailable(plan)) {

      return;

    }



    this.selectedPlan = plan;

    this.highlightedPlanId = plan.id;

    this.clearPaymentError();

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
    this.confirmPollCancelled = true;
    this.confirmingPayment = false;
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
      this.showPaymentError('account.subscribe.paypalError');
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

    if (!session.paymentIntentId) {
      throw new Error('ONVO session missing paymentIntentId');
    }



    const onvo = await this.onvoLoader.load();

    const container = document.getElementById('onvo-checkout-container');

    if (!container) {

      throw new Error('ONVO checkout container not found');

    }

    container.innerHTML = '';



    onvo.pay({

      publicKey: session.publishableKey,

      // Confirm the invoice payment intent. Subscription-mode /api/pay was
      // returning the incomplete session without attaching a card.
      paymentType: 'one_time',

      paymentIntentId: session.paymentIntentId,

      subscriptionId: session.subscriptionId,

      customerId: session.customerId,

      locale: this.translateService.onvoLocale,

      returnUrl: `${window.location.origin}/subscribe?onvo=3ds&planId=${plan.id}&sid=${encodeURIComponent(session.subscriptionId)}`,

      onSuccess: (data: unknown) => {
        this.ngZone.run(() => {
          if (this.handleOnvoChallenge(data)) {
            return;
          }
          this.clearPaymentError();
          this.waitForOnvoConfirmation(plan, session.subscriptionId);
        });
      },
      onError: (data: unknown) => {
        this.ngZone.run(() => {
          if (this.handleOnvoChallenge(data)) {
            return;
          }
          this.onOnvoPayError(data, plan, session.subscriptionId);
        });
      }

    }).render('#onvo-checkout-container');

  }



  private async loadPayPalCheckout(plan: SubscriptionPlan): Promise<void> {

    if (!this.paypalEnabled) {
      throw new Error('PayPal checkout is disabled.');
    }

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
    this.waitForOnvoConfirmation(plan, subscriptionId);
  }

  private async waitForOnvoConfirmation(plan: SubscriptionPlan, subscriptionId: string): Promise<void> {
    const user = this.userService.loggedUser.value;
    if (!user?.id) {
      return;
    }

    this.confirmPollCancelled = false;
    this.confirmingPayment = true;
    this.showPaymentError('account.subscribe.confirming');
    this.cdr.detectChanges();

    const deadline = Date.now() + 150000;
    while (!this.confirmPollCancelled && Date.now() < deadline) {
      try {
        const status = await firstValueFrom(this.subscriptionService.getOnvoStatus(subscriptionId));
        if (status?.isPaid) {
          const recorded = await firstValueFrom(
            this.subscriptionService.onvoWebSubscribe(user.id, plan.id, subscriptionId));
          if (this.confirmPollCancelled) {
            return;
          }
          if (recorded?.status && recorded.status !== 'ACTIVE') {
            await new Promise(resolve => setTimeout(resolve, 4000));
            continue;
          }
          this.confirmingPayment = false;
          this.clearPaymentError();
          this.closePaymentModal();
          this.showSuccessAndReturn(subscriptionId);
          return;
        }
      } catch {
        // Keep polling through transient API errors while the bank finishes.
      }

      await new Promise(resolve => setTimeout(resolve, 4000));
    }

    if (this.confirmPollCancelled) {
      return;
    }

    this.confirmingPayment = false;
    this.showPaymentError('account.subscribe.notConfirmed');
  }



  private showSuccessAndReturn(subscriptionId: string): void {

    if (!this.appBridge.returnToApp(subscriptionId)) {
      this.router.navigate(['/manage']);
    }

    const alert = new AlertItem();

    alert.type = 'success';

    alert.text = this.translateService.getText('account.subscribe.success');

    alert.Show();

  }



  private showError(message?: string): void {

    const alert = new AlertItem();

    alert.type = 'error';

    alert.text = message || this.translateService.getText('account.subscribe.error');

    alert.Show();

  }

  private clearPaymentError(): void {
    this.paymentError = false;
    this.paymentErrorMessage = '';
  }

  private showPaymentError(messageKey: string): void {
    this.paymentError = true;
    this.paymentErrorMessage = this.translateService.getText(messageKey);
    this.cdr.detectChanges();
  }

  private isOnvoPaid(data: unknown): boolean {
    const payload = (data || {}) as Record<string, any>;
    const status = String(payload['status'] || '').toLowerCase();
    if (status === 'succeeded' || status === 'processing' || status === 'active' || status === 'trialing') {
      return true;
    }
    const intentStatus = String(payload['paymentIntent']?.status || '').toLowerCase();
    return intentStatus === 'succeeded' || intentStatus === 'processing';
  }

  private isUnpaidOnvoSession(data: unknown): boolean {
    const payload = (data || {}) as {
      status?: string;
      paymentMethodId?: string | null;
      latestInvoice?: { attempted?: boolean; lastPaymentAttempt?: unknown };
    };
    if (payload.status !== 'incomplete') {
      return false;
    }
    if (payload.paymentMethodId) {
      return false;
    }
    const invoice = payload.latestInvoice;
    if (invoice && invoice.attempted === false && !invoice.lastPaymentAttempt) {
      return true;
    }
    return !payload.paymentMethodId;
  }

  private onOnvoPayError(data: unknown, plan: SubscriptionPlan, subscriptionId: string): void {
    const payload = (data || {}) as {
      status?: string;
      code?: string;
      type?: string;
      details?: { card?: { reason?: string } };
    };

    if (payload.status === 'incomplete' && !payload.code && !payload.details?.card) {
      return;
    }

    const reason = payload.details?.card?.reason;
    if (reason === 'issuer_declined') {
      this.showPaymentError('account.subscribe.cardDeclined');
      return;
    }

    if (payload.code === 'cards.invalid_card_info') {
      this.showPaymentError('account.subscribe.cardInvalid');
      return;
    }

    this.waitForOnvoConfirmation(plan, subscriptionId);
  }

  private handleOnvoChallenge(data: unknown): boolean {
    const payload = (data || {}) as Record<string, any>;
    const intent = payload['paymentIntent'] || payload;
    const status = intent?.status || payload['status'];
    const next = intent?.nextAction || payload['nextAction'] || payload['next_action'];
    if (status !== 'requires_action' && !next) {
      return false;
    }

    const url = next?.redirectToUrl?.url
      || next?.redirect_to_url?.url
      || next?.url;
    if (typeof url === 'string' && url.length > 0) {
      this.showPaymentError('account.subscribe.threeDs');
      window.location.assign(url);
      return true;
    }

    this.showPaymentError('account.subscribe.threeDs');
    return true;
  }

}


import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertItem } from 'src/app/code/helpers/AlertItem';
import { FamilyMember } from 'src/app/code/models/Entity/familyMember';
import { PaymentHistory } from 'src/app/code/models/Entity/paymentHistory';
import { Subscription } from 'src/app/code/models/Entity/subscription';
import { AuthenticatedDto } from 'src/app/code/models/shared/AuthenticatedDto';
import { FamilyService } from 'src/app/code/services/family.service';
import { SubscriptionService } from 'src/app/code/services/subscription.service';
import { TranslateService } from 'src/app/code/services/translate.service';
import { UserService } from 'src/app/code/services/user.service';

@Component({
  selector: 'app-account-manage',
  templateUrl: './manage.component.html',
  styleUrls: ['./manage.component.css']
})
export class ManageComponent implements OnInit {

  loading = false;
  loaded = false;
  userId = 0;
  mainUser?: AuthenticatedDto;
  subscription?: Subscription;
  payments: Array<PaymentHistory> = new Array<PaymentHistory>();
  paymentColumns: string[] = ['date', 'amount', 'status', 'transaction'];

  // Family sub-accounts
  readonly maxFamilyMembers = 5;
  familyMembers: Array<FamilyMember> = [];
  familyLoading = false;
  inviteEmail = '';
  inviting = false;

  constructor(
    private subscriptionService: SubscriptionService,
    private familyService: FamilyService,
    private userService: UserService,
    public translateService: TranslateService,
    private router: Router) { }

  ngOnInit(): void {
    const user = this.userService.loggedUser.value;
    if (!user || !user.id) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/manage' } });
      return;
    }
    this.mainUser = user;
    this.userId = user.id;
    this.load();
  }

  get userFullName(): string {
    if (!this.mainUser) {
      return '';
    }
    const name = `${this.mainUser.firstName || ''} ${this.mainUser.lastName || ''}`.trim();
    return name || this.mainUser.email || '';
  }

  get userInitials(): string {
    const f = (this.mainUser?.firstName || '').trim();
    const l = (this.mainUser?.lastName || '').trim();
    if (f || l) {
      return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase() || f.charAt(0).toUpperCase();
    }
    return (this.mainUser?.email || '?').charAt(0).toUpperCase();
  }

  /** A family/"familiar" plan unlocks sub-account management. */
  get isFamilyPlan(): boolean {
    const name = (this.subscription?.plan?.name || '').toLowerCase();
    return name.includes('famil');
  }

  load(): void {
    this.loading = true;
    this.subscription = undefined;
    this.payments = [];

    this.subscriptionService.syncOnvoSubscription(this.userId).subscribe({
      next: (res: Subscription) => this.afterSubscriptionLoaded(res),
      error: () => {
        this.subscriptionService.getUserSubscription(this.userId).subscribe({
          next: (res: Subscription) => this.afterSubscriptionLoaded(res),
          error: () => this.afterSubscriptionLoaded(undefined)
        });
      }
    });

    this.subscriptionService.getPaymentHistory(this.userId).subscribe({
      next: (res: Array<PaymentHistory>) => this.payments = res || [],
      error: () => this.payments = []
    });
  }

  get hasVisibleSubscription(): boolean {
    const status = this.subscription?.status;
    return status === 'ACTIVE' || status === 'CANCELLED' || status === 'SUSPENDED';
  }

  private afterSubscriptionLoaded(res?: Subscription): void {
    this.subscription = res;
    this.loaded = true;
    this.loading = false;
    if (this.isFamilyPlan) {
      this.loadFamily();
    } else {
      this.familyMembers = [];
    }
  }

  get canCancel(): boolean {
    return this.subscription?.status === 'ACTIVE';
  }

  get canReactivate(): boolean {
    return this.subscription?.status === 'CANCELLED';
  }

  goToPlans(): void {
    this.router.navigate(['/subscribe']);
  }

  cancel(): void {
    if (!this.canCancel) {
      return;
    }

    const confirm = new AlertItem();
    confirm.type = 'warning';
    confirm.text = this.translateService.getText('account.manage.cancel.confirm');
    confirm.showCancelButton = true;
    confirm.showCloseButton = true;
    confirm.cancelButtonText = this.translateService.getText('form.general.cancel');
    confirm.confirmButtonText = this.translateService.getText('account.manage.cancel');
    confirm.focusConfirm = true;

    confirm.Confirm().then((res: any) => {
      if (res.dismiss != 'cancel' && res.isConfirmed) {
        this.loading = true;
        this.subscriptionService.cancel(this.userId, 'Cancelled by user from web portal').subscribe({
          next: () => this.afterOperation('account.manage.cancel.success'),
          error: () => this.afterOperation('account.manage.operation.error', true)
        });
      }
    });
  }

  reactivate(): void {
    if (!this.canReactivate) {
      return;
    }
    this.loading = true;
    this.subscriptionService.reactivate(this.userId).subscribe({
      next: () => this.afterOperation('account.manage.reactivate.success'),
      error: () => this.afterOperation('account.manage.operation.error', true)
    });
  }

  private afterOperation(messageKey: string, isError: boolean = false): void {
    this.loading = false;
    const alert = new AlertItem();
    alert.type = isError ? 'error' : 'success';
    alert.text = this.translateService.getText(messageKey);
    alert.Show().then(() => {
      if (!isError) {
        this.load();
      }
    });
  }

  // ----- Family sub-accounts -----

  get activeFamilyCount(): number {
    return this.familyMembers.length;
  }

  get canInviteMore(): boolean {
    return this.subscription?.status === 'ACTIVE' && this.activeFamilyCount < this.maxFamilyMembers;
  }

  loadFamily(): void {
    this.familyLoading = true;
    this.familyService.getMembers(this.userId).subscribe({
      next: (res: Array<FamilyMember>) => {
        this.familyMembers = res || [];
        this.familyLoading = false;
      },
      error: () => {
        this.familyMembers = [];
        this.familyLoading = false;
      }
    });
  }

  invite(): void {
    const email = (this.inviteEmail || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      const alert = new AlertItem();
      alert.type = 'warning';
      alert.text = this.translateService.getText('account.family.invalidEmail');
      alert.Show();
      return;
    }
    if (!this.canInviteMore) {
      return;
    }

    this.inviting = true;
    this.familyService.invite(this.userId, email).subscribe({
      next: () => {
        this.inviting = false;
        this.inviteEmail = '';
        const alert = new AlertItem();
        alert.type = 'success';
        alert.text = this.translateService.getText('account.family.inviteSent');
        alert.Show().then(() => this.loadFamily());
      },
      error: (err: any) => {
        this.inviting = false;
        const alert = new AlertItem();
        alert.type = 'error';
        alert.text = err?.error?.message || this.translateService.getText('account.family.inviteError');
        alert.Show();
      }
    });
  }

  removeMember(member: FamilyMember): void {
    const confirm = new AlertItem();
    confirm.type = 'warning';
    confirm.text = this.translateService.getText('account.family.removeConfirm');
    confirm.showCancelButton = true;
    confirm.showCloseButton = true;
    confirm.cancelButtonText = this.translateService.getText('form.general.cancel');
    confirm.confirmButtonText = this.translateService.getText('account.family.remove');
    confirm.focusConfirm = true;

    confirm.Confirm().then((res: any) => {
      if (res.dismiss != 'cancel' && res.isConfirmed) {
        this.familyService.remove(this.userId, member.id).subscribe({
          next: () => this.loadFamily(),
          error: () => {
            const alert = new AlertItem();
            alert.type = 'error';
            alert.text = this.translateService.getText('account.family.removeError');
            alert.Show();
          }
        });
      }
    });
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AppLanguage = 'es' | 'eng';

@Injectable({
  providedIn: 'root'
})
export class TranslateService {
  private static readonly STORAGE_KEY = 'criolla-subscriptions-lang';

  static tags: any = {};
  languageChange: BehaviorSubject<AppLanguage> = new BehaviorSubject<AppLanguage>('es');
  languageLoaded: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  currentLanguage: AppLanguage = 'es';

  constructor(private http: HttpClient) {
    this.languageChange.subscribe(lang => {
      if (lang !== this.currentLanguage) {
        this.currentLanguage = lang;
        this.loadLangualge();
      }
    });
  }

  /** Default Spanish; restore saved preference when present. */
  initializeLanguage(): void {
    const stored = localStorage.getItem(TranslateService.STORAGE_KEY);
    const lang: AppLanguage = stored === 'eng' ? 'eng' : 'es';
    this.setLanguage(lang);
  }

  setLanguage(lang: AppLanguage): void {
    localStorage.setItem(TranslateService.STORAGE_KEY, lang);
    this.applyDocumentLanguage(lang);

    if (lang !== this.languageChange.value) {
      this.languageChange.next(lang);
      return;
    }

    if (!TranslateService.tags || Object.keys(TranslateService.tags).length === 0) {
      this.currentLanguage = lang;
      this.loadLangualge();
    }
  }

  isCurrentLanguage(lang: AppLanguage): boolean {
    return this.currentLanguage === lang;
  }

  /** ONVO SDK expects es | en. */
  get onvoLocale(): 'es' | 'en' {
    return this.currentLanguage === 'eng' ? 'en' : 'es';
  }

  private applyDocumentLanguage(lang: AppLanguage): void {
    document.documentElement.lang = lang === 'eng' ? 'en' : 'es';
  }

  loadLangualge() {
    const url = `assets/lang/${this.currentLanguage}.json?v=${Date.now()}`;
    this.http.get(url).subscribe({
      next: res => {
        TranslateService.tags = res;
        this.languageLoaded.next(true);
      },
      error: () => {
        if (this.currentLanguage !== 'es') {
          localStorage.setItem(TranslateService.STORAGE_KEY, 'es');
          this.languageChange.next('es');
        }
      }
    });
  }

  getText(id: string): string {
    const content = TranslateService.tags[id];
    return content ? content : id;
  }

  formatBillingFrequency(frequency?: string, style: 'badge' | 'period' = 'period'): string {
    const key = (frequency || '').toUpperCase();
    const id = style === 'badge'
      ? `subscription.plans.billing.${key}.badge`
      : `subscription.plans.billing.${key}`;
    const text = this.getText(id);
    return text !== id ? text : (frequency || '');
  }

  getPlanDescription(plan: {
    accountType?: { name?: string };
    billingFrequency?: string;
    price?: number;
    description?: string;
  }): string {
    const accountName = (plan.accountType?.name || '').toLowerCase();
    const frequency = (plan.billingFrequency || '').toUpperCase();
    const isYearly = frequency === 'YEARLY';
    const isFamily = accountName.includes('famil') || accountName.includes('familiar')
      || plan.price === 12 || plan.price === 120;

    let id: string;
    if (isFamily) {
      id = isYearly ? 'subscription.plans.desc.family.yearly' : 'subscription.plans.desc.family.monthly';
    } else {
      id = isYearly ? 'subscription.plans.desc.premium.yearly' : 'subscription.plans.desc.premium.monthly';
    }

    const text = this.getText(id);
    return text !== id ? text : (plan.description || '');
  }
}

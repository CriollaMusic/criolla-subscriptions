import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

declare global {
  interface Window { paypal: any; }
}

@Injectable({
  providedIn: 'root'
})
export class PaypalLoaderService {

  private loadPromise?: Promise<any>;

  isEnabled(): boolean {
    return !!environment.paypalEnabled;
  }

  /** PayPal Subscriptions SDK — load once per page session. */
  load(): Promise<any> {
    if (!this.isEnabled()) {
      return Promise.reject(new Error('PayPal checkout is disabled.'));
    }

    if (window.paypal) {
      return Promise.resolve(window.paypal);
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve, reject) => {
      const clientId = environment.payPalClientId;

      if (!clientId || clientId === 'YOUR_PAYPAL_WEB_CLIENT_ID') {
        reject(new Error('PayPal Client ID is not configured. Set environment.payPalClientId.'));
        return;
      }

      const script = document.createElement('script');
      const currency = environment.payPalCurrency || 'USD';
      script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&vault=true&intent=subscription&components=buttons`;
      script.async = true;
      script.onload = () => resolve(window.paypal);
      script.onerror = () => {
        this.loadPromise = undefined;
        reject(new Error('Failed to load the PayPal SDK.'));
      };
      document.body.appendChild(script);
    });

    return this.loadPromise;
  }
}

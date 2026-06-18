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

  /**
   * Dynamically loads the PayPal JS SDK configured for subscriptions.
   * Resolves with the global `paypal` object.
   */
  load(): Promise<any> {
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
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription`;
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

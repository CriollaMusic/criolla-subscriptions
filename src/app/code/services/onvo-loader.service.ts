import { Injectable } from '@angular/core';

declare global {
  interface Window {
    onvo: {
      pay: (config: OnvoPayConfig) => OnvoPayInstance;
    };
  }
}

export interface OnvoPayConfig {
  publicKey: string;
  subscriptionId?: string;
  paymentIntentId?: string;
  customerId?: string;
  paymentType: 'one_time' | 'subscription';
  locale?: 'es' | 'en';
  manualSubmit?: boolean;
  onSuccess: (data: unknown) => void;
  onError: (data: unknown) => void;
}

export interface OnvoPayInstance {
  render: (selector: string) => void;
  submitPayment?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class OnvoLoaderService {
  private loadPromise?: Promise<typeof window.onvo>;

  /** ONVO Web SDK — https://docs.onvopay.com/en/integrations/sdk */
  load(): Promise<typeof window.onvo> {
    if (window.onvo?.pay) {
      return Promise.resolve(window.onvo);
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://sdk.onvopay.com/sdk.js';
      script.async = true;
      script.onload = () => {
        if (window.onvo?.pay) {
          resolve(window.onvo);
        } else {
          this.loadPromise = undefined;
          reject(new Error('ONVO SDK loaded but onvo.pay is unavailable.'));
        }
      };
      script.onerror = () => {
        this.loadPromise = undefined;
        reject(new Error('Failed to load the ONVO SDK.'));
      };
      document.body.appendChild(script);
    });

    return this.loadPromise;
  }
}

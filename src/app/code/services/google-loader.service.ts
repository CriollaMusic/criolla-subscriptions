import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleLoaderService {

  private loadPromise?: Promise<any>;

  /**
   * Returns true when a real Google OAuth Web Client ID has been configured.
   */
  isConfigured(): boolean {
    const clientId = environment.googleClientId;
    return !!clientId && clientId !== 'YOUR_GOOGLE_WEB_CLIENT_ID';
  }

  /**
   * Dynamically loads the Google Identity Services SDK.
   * Resolves with the global `google` object (window.google).
   */
  load(): Promise<any> {
    const existing = (window as any).google;
    if (existing && existing.accounts && existing.accounts.id) {
      return Promise.resolve(existing);
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve, reject) => {
      if (!this.isConfigured()) {
        reject(new Error('Google Client ID is not configured. Set environment.googleClientId.'));
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve((window as any).google);
      script.onerror = () => {
        this.loadPromise = undefined;
        reject(new Error('Failed to load the Google Identity Services SDK.'));
      };
      document.body.appendChild(script);
    });

    return this.loadPromise;
  }
}

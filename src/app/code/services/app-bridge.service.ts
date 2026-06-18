import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

/**
 * Bridges the web subscription flow back to the native Criolla app.
 *
 * When the native app opens this site it appends `?from=app` (see
 * `environment.appReturnParam`). We persist that marker for the whole browser
 * session so that, after the user completes a subscription, we can hand control
 * back to the app via a custom-scheme deep link (`environment.appDeepLink`).
 */
@Injectable({
  providedIn: 'root'
})
export class AppBridgeService {

  private static readonly StorageKey = 'criolla_return_to_app';

  /**
   * Reads the launch query string and, if the app marker is present, remembers
   * it for the rest of the session. Call this once at app bootstrap, before the
   * Angular router strips the query params.
   */
  captureReturnFlag(): void {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('from') === environment.appReturnParam) {
        sessionStorage.setItem(AppBridgeService.StorageKey, '1');
      }
    } catch {
      // Ignore — running outside a browser context.
    }
  }

  /** True when this session was launched from the native app. */
  shouldReturnToApp(): boolean {
    try {
      return sessionStorage.getItem(AppBridgeService.StorageKey) === '1';
    } catch {
      return false;
    }
  }

  /**
   * Redirects to the native app deep link so it comes to the foreground and
   * refreshes the user's subscription. Returns true if a redirect was issued.
   */
  returnToApp(subscriptionId?: string): boolean {
    if (!this.shouldReturnToApp()) {
      return false;
    }

    try {
      sessionStorage.removeItem(AppBridgeService.StorageKey);
    } catch {
      // Non-fatal.
    }

    let url = environment.appDeepLink;
    if (subscriptionId) {
      url += `?sid=${encodeURIComponent(subscriptionId)}`;
    }

    window.location.href = url;
    return true;
  }
}

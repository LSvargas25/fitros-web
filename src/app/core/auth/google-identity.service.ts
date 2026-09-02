import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';

interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

interface GooglePromptNotification {
  isNotDisplayed(): boolean;
  isSkippedMoment(): boolean;
  isDismissedMoment(): boolean;
}

interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    cancel_on_tap_outside?: boolean;
    auto_select?: boolean;
  }): void;
  prompt(listener?: (notification: GooglePromptNotification) => void): void;
  cancel(): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

const GSI_SRC = 'https://accounts.google.com/gsi/client';

/**
 * Thin wrapper around Google Identity Services. Loads the GIS script on first
 * use, opens the account chooser, and hands back the returned id_token (a JWT)
 * for the app to exchange at POST /api/Auth/google.
 */
@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {

  private scriptPromise: Promise<void> | null = null;

  /** False until a real OAuth client ID is set in the environment. */
  get isConfigured(): boolean {
    return !!environment.googleClientId;
  }

  async requestIdToken(): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('Google sign-in is not configured yet.');
    }

    await this.loadScript();

    const accountsId = window.google?.accounts?.id;
    if (!accountsId) {
      throw new Error('Google sign-in could not be loaded. Please try again.');
    }

    return new Promise<string>((resolve, reject) => {
      accountsId.initialize({
        client_id: environment.googleClientId,
        cancel_on_tap_outside: true,
        callback: (response) => {
          if (response?.credential) {
            resolve(response.credential);
          } else {
            reject(new Error('Google did not return a credential.'));
          }
        },
      });

      accountsId.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          reject(new Error('Google sign-in was dismissed.'));
        }
      });
    });
  }

  private loadScript(): Promise<void> {
    if (this.scriptPromise) {
      return this.scriptPromise;
    }

    this.scriptPromise = new Promise<void>((resolve, reject) => {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }

      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${GSI_SRC}"]`,
      );
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () =>
          reject(new Error('Failed to load Google sign-in.')),
        );
        return;
      }

      const script = document.createElement('script');
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        this.scriptPromise = null;
        reject(new Error('Failed to load Google sign-in.'));
      };
      document.head.appendChild(script);
    });

    return this.scriptPromise;
  }
}

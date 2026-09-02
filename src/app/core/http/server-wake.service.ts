import { Injectable, signal } from '@angular/core';

/**
 * Render's free tier spins the API down after ~15 min idle; the first request
 * then takes 30-60s while the instance boots. Show a hint once any API request
 * has been pending this long so the user knows the blank/loading screen is the
 * server waking, not a hang.
 */
export const WAKE_HINT_DELAY_MS = 5000;

@Injectable({ providedIn: 'root' })
export class ServerWakeService {

  private readonly _waking = signal(false);

  /** True while at least one API request has been in flight past the delay. */
  readonly waking = this._waking.asReadonly();

  private inFlight = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;

  requestStarted(): void {
    this.inFlight += 1;

    if (this.inFlight === 1 && this.timer === null) {
      this.timer = setTimeout(() => {
        this.timer = null;
        if (this.inFlight > 0) {
          this._waking.set(true);
        }
      }, WAKE_HINT_DELAY_MS);
    }
  }

  requestEnded(): void {
    this.inFlight = Math.max(0, this.inFlight - 1);

    if (this.inFlight === 0) {
      if (this.timer !== null) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      this._waking.set(false);
    }
  }
}

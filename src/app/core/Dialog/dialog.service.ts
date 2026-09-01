import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ConfirmOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export interface ConfirmState extends ConfirmOptions {
  visible: boolean;
  resolver?: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class DialogService {

  private readonly _state = new BehaviorSubject<ConfirmState>({
    visible: false
  });

  readonly state$ = this._state.asObservable();

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this._state.next({
        ...options,
        visible: true,
        resolver: resolve
      });
    });
  }

  close(result: boolean): void {
    const current = this._state.value;

    if (current.resolver) {
      current.resolver(result);
    }

    this._state.next({ visible: false });
  }
}

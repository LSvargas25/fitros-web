import {
  Component,
  inject,
  HostListener,
  OnDestroy,
  effect,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogService } from '../../../Core/Dialog/dialog.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.html'
})
export class ConfirmDialog implements OnDestroy {

  private readonly dialog = inject(DialogService);

  private readonly stateSignal = toSignal(this.dialog.state$);

  readonly state$ = this.dialog.state$;
  readonly isVisible = signal(false);
  readonly isAnimatingOut = signal(false);

  constructor() {
    effect(() => {
      const state = this.stateSignal();

      if (state?.visible) {
        this.lockScroll();
        this.isVisible.set(true);
        this.isAnimatingOut.set(false);
      }
    });
  }

  private lockScroll(): void {
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollBarWidth}px`;
  }

  private unlockScroll(): void {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.close(false);
  }

  onBackdropClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('dialog-backdrop')) {
      this.close(false);
    }
  }

  confirm(): void {
    this.close(true);
  }

  cancel(): void {
    this.close(false);
  }

  private close(result: boolean): void {
    this.isAnimatingOut.set(true);

    setTimeout(() => {
      this.isVisible.set(false);
      this.dialog.close(result);
      this.unlockScroll();
    }, 200);
  }

  ngOnDestroy(): void {
    this.unlockScroll();
  }
}

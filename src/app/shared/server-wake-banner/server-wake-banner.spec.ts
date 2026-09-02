import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { ServerWakeBanner } from './server-wake-banner';
import { ServerWakeService } from '../../core/http/server-wake.service';

describe('ServerWakeBanner', () => {
  let fixture: ComponentFixture<ServerWakeBanner>;
  const waking = signal(false);

  beforeEach(async () => {
    waking.set(false);

    await TestBed.configureTestingModule({
      imports: [ServerWakeBanner],
      providers: [
        { provide: ServerWakeService, useValue: { waking: waking.asReadonly() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ServerWakeBanner);
    fixture.detectChanges();
  });

  it('renders nothing while the server is responsive', () => {
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });

  it('shows the cold-start message once waking', () => {
    waking.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Despertando el servidor');
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeTruthy();
  });
});

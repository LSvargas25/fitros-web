import { TestBed } from '@angular/core/testing';

import { GoogleIdentityService } from './google-identity.service';
import { environment } from '../../../environments/environment';

describe('GoogleIdentityService', () => {
  let service: GoogleIdentityService;

  const originalClientId = environment.googleClientId;
  const originalGoogle = (window as unknown as { google?: unknown }).google;

  const stubGoogle = (id: unknown) => {
    (window as unknown as { google?: unknown }).google = { accounts: { id } };
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GoogleIdentityService);
  });

  afterEach(() => {
    environment.googleClientId = originalClientId;
    (window as unknown as { google?: unknown }).google = originalGoogle;
  });

  it('is not configured while the client ID is empty', () => {
    environment.googleClientId = '';
    expect(service.isConfigured).toBeFalse();
  });

  it('rejects requestIdToken() when there is no client ID', async () => {
    environment.googleClientId = '';
    await expectAsync(service.requestIdToken()).toBeRejectedWithError(
      'Google sign-in is not configured yet.',
    );
  });

  it('resolves with the credential handed to the GIS callback', async () => {
    environment.googleClientId = 'test-client-id';

    let callback: (r: { credential: string }) => void = () => {};
    stubGoogle({
      initialize: (cfg: { callback: (r: { credential: string }) => void }) => {
        callback = cfg.callback;
      },
      prompt: () => callback({ credential: 'jwt-123' }),
      cancel: () => {},
    });

    await expectAsync(service.requestIdToken()).toBeResolvedTo('jwt-123');
  });

  it('rejects when the account chooser is not displayed', async () => {
    environment.googleClientId = 'test-client-id';

    stubGoogle({
      initialize: () => {},
      prompt: (listener: (n: {
        isNotDisplayed(): boolean;
        isSkippedMoment(): boolean;
        isDismissedMoment(): boolean;
      }) => void) =>
        listener({
          isNotDisplayed: () => true,
          isSkippedMoment: () => false,
          isDismissedMoment: () => false,
        }),
      cancel: () => {},
    });

    await expectAsync(service.requestIdToken()).toBeRejectedWithError(
      'Google sign-in was dismissed.',
    );
  });
});

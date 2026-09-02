import { fakeAsync, tick } from '@angular/core/testing';

import { ServerWakeService, WAKE_HINT_DELAY_MS } from './server-wake.service';

describe('ServerWakeService', () => {
  let service: ServerWakeService;

  beforeEach(() => {
    service = new ServerWakeService();
  });

  it('starts not waking', () => {
    expect(service.waking()).toBeFalse();
  });

  it('flips to waking once a request has been pending past the delay', fakeAsync(() => {
    service.requestStarted();
    expect(service.waking()).toBeFalse();

    tick(WAKE_HINT_DELAY_MS);
    expect(service.waking()).toBeTrue();

    service.requestEnded();
    expect(service.waking()).toBeFalse();
  }));

  it('never flips when the request finishes before the delay', fakeAsync(() => {
    service.requestStarted();
    tick(WAKE_HINT_DELAY_MS - 1);
    service.requestEnded();

    tick(WAKE_HINT_DELAY_MS);
    expect(service.waking()).toBeFalse();
  }));

  it('stays waking until every in-flight request has ended', fakeAsync(() => {
    service.requestStarted();
    service.requestStarted();
    tick(WAKE_HINT_DELAY_MS);
    expect(service.waking()).toBeTrue();

    service.requestEnded();
    expect(service.waking()).toBeTrue();

    service.requestEnded();
    expect(service.waking()).toBeFalse();
  }));

  it('does not underflow if requestEnded is called more than requestStarted', fakeAsync(() => {
    service.requestEnded();
    service.requestStarted();
    tick(WAKE_HINT_DELAY_MS);
    expect(service.waking()).toBeTrue();

    service.requestEnded();
    expect(service.waking()).toBeFalse();
  }));
});

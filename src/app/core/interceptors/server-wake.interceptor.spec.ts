import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { ServerWakeInterceptor } from './server-wake.interceptor';
import { ServerWakeService } from '../http/server-wake.service';
import { environment } from '../../../environments/environment';

describe('ServerWakeInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let wakeSpy: jasmine.SpyObj<ServerWakeService>;

  beforeEach(() => {
    wakeSpy = jasmine.createSpyObj('ServerWakeService', ['requestStarted', 'requestEnded']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: ServerWakeService, useValue: wakeSpy },
        { provide: HTTP_INTERCEPTORS, useClass: ServerWakeInterceptor, multi: true },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('brackets an API request with requestStarted/requestEnded', () => {
    http.get(`${environment.apiBaseUrl}/api/dashboard`).subscribe();

    expect(wakeSpy.requestStarted).toHaveBeenCalledTimes(1);
    expect(wakeSpy.requestEnded).not.toHaveBeenCalled();

    httpMock.expectOne(`${environment.apiBaseUrl}/api/dashboard`).flush({});

    expect(wakeSpy.requestEnded).toHaveBeenCalledTimes(1);
  });

  it('still calls requestEnded when the request errors', () => {
    http.get(`${environment.apiBaseUrl}/api/dashboard`).subscribe({ error: () => {} });

    httpMock.expectOne(`${environment.apiBaseUrl}/api/dashboard`).flush(
      {},
      { status: 500, statusText: 'Server Error' },
    );

    expect(wakeSpy.requestEnded).toHaveBeenCalledTimes(1);
  });

  it('ignores requests that are not for the API', () => {
    http.get('/assets/i18n/en.json').subscribe();

    httpMock.expectOne('/assets/i18n/en.json').flush({});

    expect(wakeSpy.requestStarted).not.toHaveBeenCalled();
    expect(wakeSpy.requestEnded).not.toHaveBeenCalled();
  });
});

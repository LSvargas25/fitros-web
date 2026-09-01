import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClient, HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ErrorInterceptor } from './error.interceptor';
import { ApiError } from '../http/api-error.model';

describe('ErrorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('passes a 4xx validation body through to the caller', (done) => {
    http.get('/x').subscribe({
      next: () => fail('expected error'),
      error: (err: ApiError) => {
        expect(err.status).toBe(400);
        expect(err.detail).toBe('Falta el nombre.');
        done();
      },
    });

    httpMock.expectOne('/x').flush(
      { status: 400, detail: 'Falta el nombre.' },
      { status: 400, statusText: 'Bad Request' },
    );
  });

  it('flattens a ValidationException `errors` map into `detail`', (done) => {
    http.get('/x').subscribe({
      next: () => fail('expected error'),
      error: (err: ApiError) => {
        expect(err.detail).toContain('Email inválido.');
        expect(err.detail).toContain('Contraseña muy corta.');
        done();
      },
    });

    httpMock.expectOne('/x').flush(
      { status: 400, errors: { Email: ['Email inválido.'], Password: ['Contraseña muy corta.'] } },
      { status: 400, statusText: 'Bad Request' },
    );
  });

  it('replaces a 5xx body with a generic message and drops internal fields', (done) => {
    http.get('/x').subscribe({
      next: () => fail('expected error'),
      error: (err: ApiError) => {
        expect(err.status).toBe(500);
        expect(err.detail).toBe('Ocurrió un error en el servidor. Intenta de nuevo más tarde.');
        expect((err as unknown as Record<string, unknown>)['traceId']).toBeUndefined();
        expect(err.errors).toBeUndefined();
        done();
      },
    });

    httpMock.expectOne('/x').flush(
      {
        status: 500,
        detail: 'NullReferenceException at FitRos.Api.Foo.Bar line 42',
        traceId: '00-abc-123',
        errors: { db: ['constraint violated'] },
      },
      { status: 500, statusText: 'Internal Server Error' },
    );
  });

  it('turns a connection failure (status 0) into an ApiError', (done) => {
    http.get('/x').subscribe({
      next: () => fail('expected error'),
      error: (err: ApiError) => {
        expect(err.status).toBe(0);
        done();
      },
    });

    httpMock.expectOne('/x').error(new ProgressEvent('error'));
  });

  it('converts a stalled request into a status-0 timeout error after 30s', fakeAsync(() => {
    let captured: ApiError | undefined;
    http.get('/slow').subscribe({ error: (e: ApiError) => (captured = e) });

    httpMock.expectOne('/slow');
    tick(30_000); // the `timeout` operator fires and cancels the pending request

    expect(captured?.status).toBe(0);
    expect(captured?.detail).toContain('tardó demasiado');
  }));
});

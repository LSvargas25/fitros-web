import { TestBed } from '@angular/core/testing';

import { TokenStorageService } from './token-storage.service';

const ACCESS = 'fitros.access_token';
const REFRESH = 'fitros.refresh_token';
const MODE = 'fitros.storage_mode';

describe('TokenStorageService', () => {
  let service: TokenStorageService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenStorageService);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('stores tokens in localStorage when rememberMe is true', () => {
    service.setTokens('a', 'r', true);

    expect(localStorage.getItem(ACCESS)).toBe('a');
    expect(localStorage.getItem(REFRESH)).toBe('r');
    expect(localStorage.getItem(MODE)).toBe('local');
    expect(sessionStorage.getItem(ACCESS)).toBeNull();
    expect(service.getAccessToken()).toBe('a');
    expect(service.getRefreshToken()).toBe('r');
  });

  it('stores tokens in sessionStorage when rememberMe is false', () => {
    service.setTokens('a', 'r', false);

    expect(sessionStorage.getItem(ACCESS)).toBe('a');
    expect(localStorage.getItem(ACCESS)).toBeNull();
    expect(localStorage.getItem(MODE)).toBe('session');
    expect(service.getAccessToken()).toBe('a');
  });

  it('does not leave a stale copy in the other storage when the mode changes', () => {
    service.setTokens('a1', 'r1', true);
    service.setTokens('a2', 'r2', false);

    expect(localStorage.getItem(ACCESS)).toBeNull();
    expect(localStorage.getItem(REFRESH)).toBeNull();
    expect(sessionStorage.getItem(ACCESS)).toBe('a2');
  });

  it('clear() wipes both storages and the mode flag', () => {
    service.setTokens('a', 'r', true);
    service.clear();

    expect(localStorage.getItem(ACCESS)).toBeNull();
    expect(localStorage.getItem(REFRESH)).toBeNull();
    expect(sessionStorage.getItem(ACCESS)).toBeNull();
    expect(localStorage.getItem(MODE)).toBeNull();
    expect(service.getAccessToken()).toBeNull();
  });

  it('reads from sessionStorage while the saved mode is "session"', () => {
    service.setTokens('a', 'r', false);
    expect(service.getAccessToken()).toBe('a');

    // mode flag drives which storage getAccessToken() looks at
    localStorage.setItem(MODE, 'local');
    expect(service.getAccessToken()).toBeNull();
  });
});

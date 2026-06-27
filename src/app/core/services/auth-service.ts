import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import {
  BehaviorSubject,
  catchError,
  filter,
  map,
  Observable,
  switchMap,
  take,
  tap,
  throwError,
} from 'rxjs';
import { ApiService } from './api-service';
import { AuthRequest } from '../../features/auth/dto/auth-request';
import { LoginResponse } from '../../features/auth/dto/login-response';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);

  private readonly _token = signal<string | null>(
    localStorage.getItem(ACCESS_TOKEN_KEY),
  );
  private readonly _refreshToken = signal<string | null>(
    localStorage.getItem(REFRESH_TOKEN_KEY),
  );

  private isRefreshing = false;
  private readonly refreshSubject$ = new BehaviorSubject<string | null>(null);

  public readonly token = this._token.asReadonly();
  public readonly isAuthenticated = computed(() => this._token() !== null);

  login(request: AuthRequest): Observable<LoginResponse> {
    return this.api
      .post<LoginResponse>('/login', request)
      .pipe(tap(response => this.persist(response)));
  }

  register(request: AuthRequest): Observable<LoginResponse> {
    return this.api
      .post<void>('/register', request)
      .pipe(switchMap(() => this.login(request)));
  }

  logout(): void {
    this._token.set(null);
    this._refreshToken.set(null);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Called by the interceptor when a 401 is received.
   * Handles concurrent requests: only one refresh runs at a time;
   * the others wait on refreshSubject$ and retry with the new token.
   */
  handleUnauthorized(
    req: HttpRequest<unknown>,
    next: HttpHandlerFn,
  ): Observable<HttpEvent<unknown>> {
    if (this.isRefreshing) {
      return this.refreshSubject$.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => next(this.withBearer(req, token!))),
      );
    }

    this.isRefreshing = true;
    this.refreshSubject$.next(null);

    const refreshToken = this._refreshToken();
    if (!refreshToken) {
      this.isRefreshing = false;
      return throwError(() => new Error('No refresh token available'));
    }

    return this.api.post<LoginResponse>('/refresh', { refreshToken }).pipe(
      catchError(err => {
        this.isRefreshing = false;
        this.refreshSubject$.next(null);
        return throwError(() => err);
      }),
      tap(response => this.persist(response)),
      map(response => response.accessToken),
      switchMap(token => {
        this.isRefreshing = false;
        this.refreshSubject$.next(token);
        return next(this.withBearer(req, token));
      }),
    );
  }

  private persist(response: LoginResponse): void {
    this._token.set(response.accessToken);
    this._refreshToken.set(response.refreshToken);
    localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
  }

  private withBearer(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
}

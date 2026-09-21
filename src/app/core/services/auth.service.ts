import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  RefreshTokenRequest,
  LogoutRequest,
  MessageResponse,
  ChangePasswordRequest
} from '../models/auth.model';
import { User, UserUpdate } from '../models/user.model';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private tokenService = inject(TokenService);

  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly USERS_URL = `${environment.apiUrl}/users`;

  // Signals for state management
  currentUser = signal<User | null>(null);
  isLoading = signal<boolean>(false);

  // Computed signals
  permissions = computed<string[]>(() => {
    return this.currentUser()?.permissions || [];
  });

  hasPermission(permissionCode: string): boolean {
    return this.permissions().includes(permissionCode);
  }


  constructor() {
    if (this.tokenService.hasValidToken()) {
      this.fetchCurrentUser().subscribe({
        error: () => this.tokenService.clearTokens()
      });
    }
  }

  register(credentials: RegisterRequest): Observable<TokenResponse> {
    this.isLoading.set(true);
    return this.http.post<TokenResponse>(`${this.API_URL}/register`, credentials).pipe(
      tap((response) => {
        this.tokenService.setTokens(response.access_token, response.refresh_token);
        this.currentUser.set(response.user);
        this.isLoading.set(false);
      }),
      catchError((error) => {
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  login(credentials: LoginRequest): Observable<TokenResponse> {
    this.isLoading.set(true);
    return this.http.post<TokenResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap((response) => {
        this.tokenService.setTokens(response.access_token, response.refresh_token);
        this.currentUser.set(response.user);
        this.isLoading.set(false);
      }),
      catchError((error) => {
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  refreshToken(): Observable<TokenResponse> {
    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const payload: RefreshTokenRequest = { refresh_token: refreshToken };
    return this.http.post<TokenResponse>(`${this.API_URL}/refresh`, payload).pipe(
      tap((response) => {
        this.tokenService.setTokens(response.access_token, response.refresh_token);
        this.currentUser.set(response.user);
      })
    );
  }

  logout(): Observable<MessageResponse> {
    const refreshToken = this.tokenService.getRefreshToken();
    const payload: LogoutRequest = { refresh_token: refreshToken || undefined };

    return this.http.post<MessageResponse>(`${this.API_URL}/logout`, payload).pipe(
      tap(() => this.handleLogoutCleanup()),
      catchError((error) => {
        this.handleLogoutCleanup();
        return throwError(() => error);
      })
    );
  }

  fetchCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.USERS_URL}/me`).pipe(
      tap((user) => this.currentUser.set(user))
    );
  }

  updateProfile(updateData: UserUpdate): Observable<User> {
    return this.http.put<User>(`${this.USERS_URL}/me`, updateData).pipe(
      tap((user) => this.currentUser.set(user))
    );
  }

  changePassword(data: ChangePasswordRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.API_URL}/change-password`, data);
  }


  private handleLogoutCleanup(): void {
    this.tokenService.clearTokens();
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }
}

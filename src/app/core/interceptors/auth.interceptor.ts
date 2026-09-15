import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { TokenService } from '../services/token.service';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);

  const accessToken = tokenService.getAccessToken();

  // Don't add token to auth endpoints like login and register
  const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/register');

  let authReq = req;
  if (accessToken && !isAuthEndpoint) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized for non-auth endpoints
      if (error.status === 401 && !isAuthEndpoint && tokenService.getRefreshToken()) {
        return authService.refreshToken().pipe(
          switchMap((newTokenResponse) => {
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newTokenResponse.access_token}`
              }
            });
            return next(retryReq);
          }),
          catchError((refreshErr) => {
            tokenService.clearTokens();
            return throwError(() => refreshErr);
          })
        );
      }
      return throwError(() => error);
    })
  );
};

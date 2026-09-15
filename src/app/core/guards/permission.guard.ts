import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const permissionGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredPermission = route.data?.['permission'] as string;
  if (!requiredPermission || authService.hasPermission(requiredPermission)) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};

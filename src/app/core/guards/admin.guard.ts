import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs/operators';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return toObservable(authService.isLoaded).pipe(
    filter((loaded) => loaded),
    take(1),
    map(() => {
      if (authService.isAdmin()) {
        return true;
      }
      router.navigate(['/dashboard']);
      return false;
    })
  );
};

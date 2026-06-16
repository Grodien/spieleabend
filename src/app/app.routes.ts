import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
  },
  {
    path: 'players',
    loadComponent: () =>
      import('./features/players/player-list').then((m) => m.PlayerListComponent),
  },
  {
    path: 'scoreboard',
    loadComponent: () =>
      import('./features/scoreboard/scoreboard').then((m) => m.ScoreboardComponent),
    canActivate: [adminGuard],
  },
  {
    path: 'games',
    loadComponent: () => import('./features/games/game-list').then((m) => m.GameListComponent),
  },
  {
    path: 'game-nights',
    loadComponent: () =>
      import('./features/game-nights/game-night-list').then((m) => m.GameNightListComponent),
  },
  {
    path: 'game-nights/new',
    loadComponent: () =>
      import('./features/game-nights/game-night-create').then((m) => m.GameNightCreateComponent),
    canActivate: [adminGuard],
  },
  {
    path: 'admin/users',
    loadComponent: () =>
      import('./features/admin/user-management').then((m) => m.UserManagementComponent),
    canActivate: [adminGuard],
  },
  {
    path: 'game-nights/:id',
    loadComponent: () =>
      import('./features/game-nights/game-night-detail').then((m) => m.GameNightDetailComponent),
  },
];

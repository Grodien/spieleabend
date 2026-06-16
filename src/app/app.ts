import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver } from '@angular/cdk/layout';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  authService = inject(AuthService);

  navItems = computed(() => {
    const items = [
      { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
      { path: '/game-nights', icon: 'casino', label: 'Spieleabende' },
    ];
    
    // Only admins see the live scoreboard in navigation
    if (this.authService.isAdmin()) {
      items.push({ path: '/scoreboard', icon: 'scoreboard', label: 'Scoreboard' });
      items.push({ path: '/admin/users', icon: 'admin_panel_settings', label: 'Benutzer verwalten' });
    }
    
    items.push(
      { path: '/players', icon: 'group', label: 'Spieler' },
      { path: '/games', icon: 'sports_esports', label: 'Spiele' }
    );
    
    return items;
  });

  private breakpointObserver = inject(BreakpointObserver);
  isDesktop = signal(true);

  ngOnInit() {
    this.breakpointObserver.observe(['(min-width: 768px)']).subscribe((result) => {
      this.isDesktop.set(result.matches);
    });
  }
}

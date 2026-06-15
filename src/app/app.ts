import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BreakpointObserver } from '@angular/cdk/layout';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  navItems = [
    { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/game-nights', icon: 'casino', label: 'Spieleabende' },
    { path: '/scoreboard', icon: 'scoreboard', label: 'Scoreboard' },
    { path: '/players', icon: 'group', label: 'Spieler' },
    { path: '/games', icon: 'sports_esports', label: 'Spiele' },
  ];

  private breakpointObserver = inject(BreakpointObserver);
  isDesktop = signal(true);

  ngOnInit() {
    this.breakpointObserver.observe(['(min-width: 768px)']).subscribe((result) => {
      this.isDesktop.set(result.matches);
    });
  }
}

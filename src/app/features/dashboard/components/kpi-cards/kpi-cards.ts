import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DashboardStatsService } from '../../services/dashboard-stats.service';

@Component({
  selector: 'app-kpi-cards',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="kpi-grid animate-slide-in">
      <div class="stat-card">
        <div class="stat-icon">🎯</div>
        <div class="stat-value">{{ stats.totalNights() }}</div>
        <div class="stat-label">Spieleabende</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🎲</div>
        <div class="stat-value">{{ stats.totalGamesPlayed() }}</div>
        <div class="stat-label">Spiele gespielt</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-value">{{ stats.players().length }}</div>
        <div class="stat-label">Spieler</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-value">{{ stats.totalSpent() | number:'1.0-0' }}</div>
        <div class="stat-label">Total Pot</div>
      </div>
    </div>

  `,
  styles: `
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    @media (max-width: 1024px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 768px) {
      .kpi-grid { grid-template-columns: 1fr 1fr; }
    }
  `,
})
export class KpiCardsComponent {
  stats = inject(DashboardStatsService);
}

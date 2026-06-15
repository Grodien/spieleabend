import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DashboardStatsService } from '../../services/dashboard-stats.service';

@Component({
  selector: 'app-player-stats',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <!-- Gesamtkosten pro Spieler -->
    <div class="section glass-card" style="animation: slideInUp 0.5s ease-out 0.1s backwards">
      <h3 class="section-title">💰 Gesamtkosten pro Spieler</h3>
      <div class="bar-chart">
        @for (stat of stats.playerStats(); track stat.playerId) {
          <div class="bar-row">
            <div class="bar-label">
              <div class="bar-avatar">{{ stat.name.charAt(0).toUpperCase() }}</div>
              <div class="bar-player-info">
                <span class="bar-player-name">{{ stat.name }}</span>
                <span class="bar-player-detail">
                  {{ stat.nightsPlayed }}
                  @if (stat.nightsPlayed === 1) { Abend } @else { Abende }
                </span>
              </div>
            </div>
            <div class="bar-track">
              <div class="bar-fill"
                   [style.width]="stats.getBarWidth(stat.totalCost) + '%'"
                   [class.bar-negative]="stat.totalCost < 0">
              </div>
            </div>
            <div class="bar-value"
                 [class.cost-positive]="stat.totalCost > 0"
                 [class.cost-negative]="stat.totalCost < 0">
              {{ stat.totalCost | number:'1.2-2' }} CHF
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Stats Rankings Grid -->
    <div class="stats-cards-grid">
      <!-- Ø Kosten -->
      <div class="section glass-card" style="animation: slideInUp 0.5s ease-out 0.2s backwards">
        <h3 class="section-title">📊 Ø Kosten pro Abend</h3>
        <div class="ranking-list">
          @for (stat of stats.sortedByAvgCost(); track stat.playerId; let i = $index) {
            <div class="ranking-item">
              <span class="ranking-pos">{{ i + 1 }}.</span>
              <div class="bar-avatar small">{{ stat.name.charAt(0).toUpperCase() }}</div>
              <span class="ranking-name">{{ stat.name }}</span>
              <span class="ranking-value" [class.cost-positive]="stat.avgCostPerNight > 0">
                {{ stat.avgCostPerNight | number:'1.2-2' }} CHF
              </span>
            </div>
          }
        </div>
      </div>

      <!-- Häufigste Gewinner -->
      <div class="section glass-card" style="animation: slideInUp 0.5s ease-out 0.3s backwards">
        <h3 class="section-title">🏆 Häufigste Gewinner</h3>
        <div class="ranking-list">
          @for (stat of stats.sortedByWins(); track stat.playerId; let i = $index) {
            <div class="ranking-item">
              <span class="ranking-pos">
                @if (i === 0) { 🥇 } @else if (i === 1) { 🥈 } @else if (i === 2) { 🥉 } @else { {{ i + 1 }}. }
              </span>
              <div class="bar-avatar small">{{ stat.name.charAt(0).toUpperCase() }}</div>
              <span class="ranking-name">{{ stat.name }}</span>
              <span class="ranking-value wins">{{ stat.wins }}×</span>
            </div>
          }
        </div>
      </div>

      <!-- Anwesenheit -->
      <div class="section glass-card" style="animation: slideInUp 0.5s ease-out 0.4s backwards">
        <h3 class="section-title">📅 Anwesenheit</h3>
        <div class="ranking-list">
          @for (stat of stats.anwesenheitRanking(); track stat.playerId; let i = $index) {
            <div class="ranking-item">
              <span class="ranking-pos">{{ i + 1 }}.</span>
              <div class="bar-avatar small">{{ stat.name.charAt(0).toUpperCase() }}</div>
              <span class="ranking-name">{{ stat.name }}</span>
              <div class="ranking-details">
                <span class="ranking-value">{{ stat.rate }}%</span>
                <span class="ranking-subvalue">({{ stat.nightsPlayed }}/{{ stat.totalNights }})</span>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Häufigster Verlierer -->
      <div class="section glass-card" style="animation: slideInUp 0.5s ease-out 0.5s backwards">
        <h3 class="section-title">📉 Häufigster Verlierer (Letzter)</h3>
        <div class="ranking-list">
          @for (stat of stats.haeufigsterVerliererRanking(); track stat.playerId; let i = $index) {
            <div class="ranking-item">
              <span class="ranking-pos">
                @if (i === 0) { ☠️ } @else { {{ i + 1 }}. }
              </span>
              <div class="bar-avatar small">{{ stat.name.charAt(0).toUpperCase() }}</div>
              <span class="ranking-name">{{ stat.name }}</span>
              <span class="ranking-value loses">{{ stat.count }}×</span>
            </div>
          }
        </div>
      </div>

      <!-- Schneller Lerner -->
      <div class="section glass-card" style="animation: slideInUp 0.5s ease-out 0.6s backwards">
        <h3 class="section-title">🧠 Schneller Lerner (Erstpartien)</h3>
        <div class="ranking-list">
          @for (stat of stats.schnellerLernerRanking(); track stat.playerId; let i = $index) {
            <div class="ranking-item">
              <span class="ranking-pos">
                @if (i === 0) { ⚡ } @else { {{ i + 1 }}. }
              </span>
              <div class="bar-avatar small">{{ stat.name.charAt(0).toUpperCase() }}</div>
              <span class="ranking-name">{{ stat.name }}</span>
              <span class="ranking-value learner">{{ stat.count }}×</span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: `
    .section {
      margin-bottom: 24px;
    }

    .stats-cards-grid .section {
      margin-bottom: 0;
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 20px;
    }

    .stats-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
      margin-bottom: 24px;
    }

    /* Bar Chart */
    .bar-chart {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .bar-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .bar-label {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 120px;
      min-width: 120px;
      font-size: 14px;
    }

    .bar-player-info {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
      align-items: flex-start;
    }

    .bar-player-name {
      font-weight: 600;
      font-size: 14px;
    }

    .bar-player-detail {
      font-size: 11px;
      color: var(--color-text-muted);
    }

    .bar-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--gradient-accent);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      color: #000;
      flex-shrink: 0;

      &.small {
        width: 24px;
        height: 24px;
        font-size: 11px;
      }
    }

    .bar-track {
      flex: 1;
      height: 24px;
      background: var(--color-bg-surface);
      border-radius: 12px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      background: var(--gradient-accent);
      border-radius: 12px;
      transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      min-width: 4px;
    }

    .bar-negative {
      background: linear-gradient(135deg, var(--color-success), #10b981) !important;
    }

    .bar-value {
      width: 100px;
      text-align: right;
      font-weight: 600;
      font-size: 14px;
    }

    .cost-positive { color: var(--color-danger); }
    .cost-negative { color: var(--color-success); }

    /* Ranking */
    .ranking-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .ranking-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      transition: background var(--transition-fast);

      &:hover {
        background: rgba(255, 255, 255, 0.03);
      }
    }

    .ranking-pos {
      width: 28px;
      text-align: center;
      font-weight: 600;
      color: var(--color-text-secondary);
    }

    .ranking-name {
      flex: 1;
      font-weight: 500;
      font-size: 14px;
    }

    .ranking-details {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      line-height: 1.2;
    }

    .ranking-subvalue {
      font-size: 11px;
      color: var(--color-text-muted);
      font-weight: 500;
    }

    .ranking-value {
      font-weight: 600;
      font-size: 14px;

      &.wins { color: var(--color-accent-light); }
      &.loses { color: var(--color-danger); }
      &.learner { color: var(--color-info); }
    }

    @media (max-width: 768px) {
      .bar-label {
        width: 80px;
        min-width: 80px;
      }
    }
  `,
})
export class PlayerStatsComponent {
  stats = inject(DashboardStatsService);
}

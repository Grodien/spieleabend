import { Component, inject } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { DashboardStatsService } from '../../services/dashboard-stats.service';

@Component({
  selector: 'app-last-game-night-card',
  standalone: true,
  imports: [DecimalPipe, DatePipe],
  template: `
    @if (stats.lastGameNight()) {
      <div class="section glass-card last-night-section" style="animation: slideInUp 0.5s ease-out 0.05s backwards">
        <div class="last-night-header">
          <h3 class="section-title" style="margin-bottom: 0;">🌙 Letzter Spieleabend</h3>
          <span class="last-night-date-badge">{{ stats.lastGameNight()!.date | date:'dd.MM.yyyy' }}</span>
        </div>

        <div class="last-night-content-grid">
          <!-- Kostenverteilung -->
          <div class="last-night-col">
            <h4 class="sub-title">💰 Kostenverteilung an diesem Abend</h4>
            <div class="last-night-players-list">
              @for (entry of stats.lastGameNightCosts(); track entry.playerId) {
                <div class="last-night-player-row">
                  <div class="bar-avatar small">{{ entry.name.charAt(0).toUpperCase() }}</div>
                  <span class="player-name-text">{{ entry.name }}</span>
                  <span class="player-cost-val"
                    [class.cost-zero]="entry.cost === 0"
                    [class.cost-positive]="entry.cost > 0">
                    {{ entry.cost | number:'1.2-2' }} CHF
                  </span>
                </div>
              }
            </div>
          </div>

          <!-- Gespielte Spiele -->
          <div class="last-night-col">
            <h4 class="sub-title">🎯 Gespielte Spiele &amp; Gewinner</h4>
            @if (stats.lastGameNightPlayedGames().length === 0) {
              <div class="empty-hint-sm">Keine Spiele in dieser Runde erfasst.</div>
            } @else {
              <div class="last-night-games-list">
                @for (game of stats.lastGameNightPlayedGames(); track game.id) {
                  <div class="last-night-game-row">
                    <span class="game-icon-mini">🎲</span>
                    <div class="game-info-mini">
                      <span class="game-name-text">{{ game.gameName }}</span>
                      <span class="game-winner-text">Gewinner: 🏆 {{ stats.getGameWinners(game) }}</span>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .section {
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 20px;
    }

    .last-night-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--color-border);
      padding-bottom: 12px;
    }

    .last-night-date-badge {
      padding: 4px 12px;
      background: var(--color-bg-surface);
      border-radius: 100px;
      font-size: 13px;
      font-weight: 600;
      color: var(--color-accent-light);
      border: 1px solid rgba(245, 158, 11, 0.2);
    }

    .last-night-content-grid {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 32px;
    }

    .last-night-col {
      display: flex;
      flex-direction: column;
    }

    .sub-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-secondary);
      margin-bottom: 12px;
    }

    .last-night-players-list,
    .last-night-games-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .last-night-player-row {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--color-bg-surface);
      padding: 8px 12px;
      border-radius: var(--radius-md);

      .player-name-text {
        font-weight: 500;
        font-size: 14px;
        flex: 1;
      }

      .player-cost-val {
        font-weight: 700;
        font-size: 14px;
      }
    }

    .last-night-game-row {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--color-bg-surface);
      padding: 8px 12px;
      border-radius: var(--radius-md);

      .game-icon-mini {
        font-size: 20px;
      }

      .game-info-mini {
        display: flex;
        flex-direction: column;
        line-height: 1.3;
      }

      .game-name-text {
        font-weight: 600;
        font-size: 14px;
      }

      .game-winner-text {
        font-size: 12px;
        color: var(--color-text-secondary);
      }
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

    .cost-positive { color: var(--color-danger); }

    .empty-hint-sm {
      color: var(--color-text-muted);
      font-size: 13px;
      font-style: italic;
      padding: 8px 0;
    }

    @media (max-width: 768px) {
      .last-night-content-grid {
        grid-template-columns: 1fr;
        gap: 24px;
      }
    }
  `,
})
export class LastGameNightCardComponent {
  stats = inject(DashboardStatsService);
}

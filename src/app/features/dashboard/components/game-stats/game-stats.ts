import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DashboardStatsService } from '../../services/dashboard-stats.service';

@Component({
  selector: 'app-game-stats',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <!-- Meistgespielte Spiele -->
    <div class="section glass-card" style="animation: slideInUp 0.5s ease-out 0.4s backwards">
      <h3 class="section-title">🎮 Meistgespielte Spiele</h3>
      @if (stats.gameCounts().length === 0) {
        <div class="empty-hint">Noch keine Spiele gespielt.</div>
      } @else {
        <div class="game-rank-list">
          @for (gc of stats.gameCounts(); track gc.name; let i = $index) {
            <div class="game-rank-item">
              <div class="game-rank-pos">{{ i + 1 }}</div>
              <div class="game-rank-name">{{ gc.name }}</div>
              <div class="game-rank-bar-track">
                <div class="game-rank-bar-fill" [style.width]="stats.getGameBarWidth(gc.count) + '%'"></div>
              </div>
              <div class="game-rank-count">{{ gc.count }}×</div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Extra Statistiken -->
    <div class="section glass-card" style="animation: slideInUp 0.5s ease-out 0.5s backwards">
      <h3 class="section-title">📈 Statistiken</h3>
      <div class="extra-stats-grid">
        <div class="extra-stat">
          <div class="extra-stat-value">{{ stats.avgGamesPerNight() | number:'1.1-1' }}</div>
          <div class="extra-stat-label">Ø Spiele pro Abend</div>
        </div>
        <div class="extra-stat">
          <div class="extra-stat-value">{{ stats.avgPlayersPerNight() | number:'1.1-1' }}</div>
          <div class="extra-stat-label">Ø Spieler pro Abend</div>
        </div>
        <div class="extra-stat">
          <div class="extra-stat-value">{{ stats.mostExpensivePlayer() }}</div>
          <div class="extra-stat-label">Teuerster Spieler</div>
        </div>
        <div class="extra-stat">
          <div class="extra-stat-value">{{ stats.luckiestPlayer() }}</div>
          <div class="extra-stat-label">Günstigster Spieler</div>
        </div>
      </div>
    </div>
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

    /* Game Rank */
    .game-rank-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .game-rank-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .game-rank-pos {
      width: 24px;
      text-align: center;
      font-weight: 700;
      color: var(--color-accent);
      font-size: 14px;
    }

    .game-rank-name {
      width: 150px;
      min-width: 150px;
      font-weight: 500;
      font-size: 14px;
    }

    .game-rank-bar-track {
      flex: 1;
      height: 20px;
      background: var(--color-bg-surface);
      border-radius: 10px;
      overflow: hidden;
    }

    .game-rank-bar-fill {
      height: 100%;
      background: linear-gradient(135deg, #60a5fa, #818cf8);
      border-radius: 10px;
      transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      min-width: 4px;
    }

    .game-rank-count {
      width: 40px;
      text-align: right;
      font-weight: 600;
      font-size: 14px;
      color: var(--color-text-secondary);
    }

    /* Extra Stats */
    .extra-stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .extra-stat {
      text-align: center;
      padding: 16px;
      background: var(--color-bg-surface);
      border-radius: var(--radius-md);
    }

    .extra-stat-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--color-accent-light);
      margin-bottom: 4px;
    }

    .extra-stat-label {
      font-size: 12px;
      color: var(--color-text-secondary);
      font-weight: 500;
    }

    .empty-hint {
      color: var(--color-text-muted);
      font-size: 14px;
      padding: 16px 0;
    }

    @media (max-width: 1024px) {
      .extra-stats-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `,
})
export class GameStatsComponent {
  stats = inject(DashboardStatsService);
}

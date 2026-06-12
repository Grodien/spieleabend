import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { PlayerService } from '../../core/services/player.service';
import { GameService } from '../../core/services/game.service';
import { GameNightService } from '../../core/services/game-night.service';
import { Player } from '../../core/models/player.model';
import { Game } from '../../core/models/game.model';
import { GameNight, PlayedGame } from '../../core/models/game-night.model';
import { Subscription, forkJoin, combineLatest } from 'rxjs';

interface PlayerStats {
  playerId: string;
  name: string;
  totalCost: number;
  avgCostPerNight: number;
  nightsPlayed: number;
  gamesPlayed: number;
  wins: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, DecimalPipe, DatePipe],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Dashboard</h1>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid animate-slide-in">
        <div class="stat-card">
          <div class="stat-icon">🌙</div>
          <div class="stat-value">{{ totalNights() }}</div>
          <div class="stat-label">Spieleabende</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎲</div>
          <div class="stat-value">{{ totalGamesPlayed() }}</div>
          <div class="stat-label">Spiele gespielt</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-value">{{ players().length }}</div>
          <div class="stat-label">Spieler</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-value">{{ totalSpent() | number:'1.0-0' }}</div>
          <div class="stat-label">Total CHF umverteilt</div>
        </div>
      </div>

      <!-- Letzter Spieleabend Card -->
      @if (lastGameNight()) {
        <div class="section glass-card last-night-section" style="animation: slideInUp 0.5s ease-out 0.05s backwards">
          <div class="last-night-header">
            <h3 class="section-title" style="margin-bottom: 0;">🌙 Letzter Spieleabend</h3>
            <span class="last-night-date-badge">{{ lastGameNight()!.date | date:'dd.MM.yyyy' }}</span>
          </div>
          
          <div class="last-night-content-grid">
            <!-- Left col: Player balances for that night -->
            <div class="last-night-col">
              <h4 class="sub-title">💰 Kostenverteilung an diesem Abend</h4>
              <div class="last-night-players-list">
                @for (entry of lastGameNightCosts(); track entry.playerId) {
                  <div class="last-night-player-row">
                    <div class="bar-avatar small">{{ entry.name.charAt(0).toUpperCase() }}</div>
                    <span class="player-name-text">{{ entry.name }}</span>
                    <span class="player-cost-val" [class.cost-zero]="entry.cost === 0" [class.cost-positive]="entry.cost > 0">
                      {{ entry.cost | number:'1.2-2' }} CHF
                    </span>
                  </div>
                }
              </div>
            </div>
            
            <!-- Right col: Games played -->
            <div class="last-night-col">
              <h4 class="sub-title">🎯 Gespielte Spiele & Gewinner</h4>
              @if (lastGameNightPlayedGames().length === 0) {
                <div class="empty-hint-sm">Keine Spiele in dieser Runde erfasst.</div>
              } @else {
                <div class="last-night-games-list">
                  @for (game of lastGameNightPlayedGames(); track game.id) {
                    <div class="last-night-game-row">
                      <span class="game-icon-mini">🎲</span>
                      <div class="game-info-mini">
                        <span class="game-name-text">{{ game.gameName }}</span>
                        <span class="game-winner-text">Gewinner: 🏆 {{ getGameWinners(game) }}</span>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }

      @if (playerStats().length > 0) {
        <!-- Total Costs per Player -->
        <div class="section glass-card" style="animation: slideInUp 0.5s ease-out 0.1s backwards">
          <h3 class="section-title">💰 Gesamtkosten pro Spieler</h3>
          <div class="bar-chart">
            @for (stat of playerStats(); track stat.playerId) {
              <div class="bar-row">
                <div class="bar-label">
                  <div class="bar-avatar">{{ stat.name.charAt(0).toUpperCase() }}</div>
                  <div class="bar-player-info">
                    <span class="bar-player-name">{{ stat.name }}</span>
                    <span class="bar-player-detail">
                      {{ stat.nightsPlayed }} @if (stat.nightsPlayed === 1) { Abend } @else { Abende }
                    </span>
                  </div>
                </div>
                <div class="bar-track">
                  <div class="bar-fill"
                       [style.width]="getBarWidth(stat.totalCost) + '%'"
                       [class.bar-negative]="stat.totalCost < 0">
                  </div>
                </div>
                <div class="bar-value" [class.cost-positive]="stat.totalCost > 0" [class.cost-negative]="stat.totalCost < 0">
                  {{ stat.totalCost | number:'1.2-2' }} CHF
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Average Cost and Wins Side by Side -->
        <div class="two-col-grid">
          <div class="section glass-card" style="animation: slideInUp 0.5s ease-out 0.2s backwards">
            <h3 class="section-title">📊 Ø Kosten pro Abend</h3>
            <div class="ranking-list">
              @for (stat of sortedByAvgCost(); track stat.playerId; let i = $index) {
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

          <div class="section glass-card" style="animation: slideInUp 0.5s ease-out 0.3s backwards">
            <h3 class="section-title">🏆 Häufigste Gewinner</h3>
            <div class="ranking-list">
              @for (stat of sortedByWins(); track stat.playerId; let i = $index) {
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
        </div>

        <!-- Most Played Games -->
        <div class="section glass-card" style="animation: slideInUp 0.5s ease-out 0.4s backwards">
          <h3 class="section-title">🎮 Meistgespielte Spiele</h3>
          @if (gameCounts().length === 0) {
            <div class="empty-hint">Noch keine Spiele gespielt.</div>
          } @else {
            <div class="game-rank-list">
              @for (gc of gameCounts(); track gc.name; let i = $index) {
                <div class="game-rank-item">
                  <div class="game-rank-pos">{{ i + 1 }}</div>
                  <div class="game-rank-name">{{ gc.name }}</div>
                  <div class="game-rank-bar-track">
                    <div class="game-rank-bar-fill" [style.width]="getGameBarWidth(gc.count) + '%'"></div>
                  </div>
                  <div class="game-rank-count">{{ gc.count }}×</div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Games per Night Average -->
        <div class="section glass-card" style="animation: slideInUp 0.5s ease-out 0.5s backwards">
          <h3 class="section-title">📈 Statistiken</h3>
          <div class="extra-stats-grid">
            <div class="extra-stat">
              <div class="extra-stat-value">{{ avgGamesPerNight() | number:'1.1-1' }}</div>
              <div class="extra-stat-label">Ø Spiele pro Abend</div>
            </div>
            <div class="extra-stat">
              <div class="extra-stat-value">{{ avgPlayersPerNight() | number:'1.1-1' }}</div>
              <div class="extra-stat-label">Ø Spieler pro Abend</div>
            </div>
            <div class="extra-stat">
              <div class="extra-stat-value">{{ mostExpensivePlayer() }}</div>
              <div class="extra-stat-label">Teuerster Spieler</div>
            </div>
            <div class="extra-stat">
              <div class="extra-stat-value">{{ luckiestPlayer() }}</div>
              <div class="extra-stat-label">Günstigster Spieler</div>
            </div>
          </div>
        </div>
      } @else {
        <div class="empty-state animate-scale-in" style="margin-top: 32px;">
          <div class="empty-icon">📊</div>
          <div class="empty-title">Keine Daten</div>
          <div class="empty-text">Erstelle Spieleabende und spiele ein paar Spiele, um Statistiken zu sehen.</div>
        </div>
      }
    </div>
  `,
  styles: `
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .section {
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 20px;
    }

    .two-col-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
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

    .cost-positive {
      color: var(--color-danger);
    }

    .cost-negative {
      color: var(--color-success);
    }

    /* Ranking List */
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

    .ranking-value {
      font-weight: 600;
      font-size: 14px;

      &.wins {
        color: var(--color-accent-light);
      }
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

    /* Letzter Spieleabend Styles */
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

    .last-night-players-list, .last-night-games-list {
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

    .empty-hint-sm {
      color: var(--color-text-muted);
      font-size: 13px;
      font-style: italic;
      padding: 8px 0;
    }

    @media (max-width: 1024px) {
      .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .two-col-grid {
        grid-template-columns: 1fr;
      }

      .extra-stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .kpi-grid {
        grid-template-columns: 1fr 1fr;
      }

      .bar-label {
        width: 80px;
        min-width: 80px;
      }

      .last-night-content-grid {
        grid-template-columns: 1fr;
        gap: 24px;
      }
    }
  `,
})
export class DashboardComponent implements OnInit, OnDestroy {
  private playerService = inject(PlayerService);
  private gameService = inject(GameService);
  private gameNightService = inject(GameNightService);

  players = signal<Player[]>([]);
  gameNights = signal<GameNight[]>([]);
  allPlayedGames = signal<Map<string, PlayedGame[]>>(new Map());
  private subscriptions: Subscription[] = [];

  ngOnInit() {
    const sub1 = this.playerService.getAll().subscribe((p) => this.players.set(p));
    const sub2 = this.gameNightService.getAll().subscribe((gn) => {
      this.gameNights.set(gn);
      // Load played games for each night
      gn.forEach((night) => {
        const sub = this.gameNightService.getPlayedGames(night.id).subscribe((pg) => {
          this.allPlayedGames.update((map) => {
            const newMap = new Map(map);
            newMap.set(night.id, pg);
            return newMap;
          });
        });
        this.subscriptions.push(sub);
      });
    });
    this.subscriptions.push(sub1, sub2);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  // Computed stats
  totalNights = computed(() => this.gameNights().length);

  totalGamesPlayed = computed(() => {
    let count = 0;
    this.allPlayedGames().forEach((games) => (count += games.length));
    return count;
  });

  totalSpent = computed(() => {
    let total = 0;
    this.allPlayedGames().forEach((games) => {
      games.forEach((pg) => {
        Object.values(pg.costs).forEach((cost) => {
          if (cost > 0) total += cost;
        });
      });
    });
    return total;
  });

  playerStats = computed<PlayerStats[]>(() => {
    const stats = new Map<string, PlayerStats>();

    this.players().forEach((p) => {
      stats.set(p.id, {
        playerId: p.id,
        name: p.name,
        totalCost: 0,
        avgCostPerNight: 0,
        nightsPlayed: 0,
        gamesPlayed: 0,
        wins: 0,
      });
    });

    this.gameNights().forEach((night) => {
      const nightPlayers = new Set(night.playerIds);
      nightPlayers.forEach((pid) => {
        const s = stats.get(pid);
        if (s) s.nightsPlayed++;
      });

      const pg = this.allPlayedGames().get(night.id) || [];
      pg.forEach((game) => {
        // Count costs and wins
        const scores = Object.entries(game.scores);
        const sorted = [...scores].sort((a, b) =>
          game.scoringSystem === 'highest' ? b[1] - a[1] : a[1] - b[1]
        );
        const bestScore = sorted.length > 0 ? sorted[0][1] : null;

        Object.entries(game.costs).forEach(([pid, cost]) => {
          const s = stats.get(pid);
          if (s) {
            s.totalCost += cost;
            s.gamesPlayed++;
          }
        });

        // Winners
        if (bestScore !== null) {
          scores
            .filter(([, score]) => score === bestScore)
            .forEach(([pid]) => {
              const s = stats.get(pid);
              if (s) s.wins++;
            });
        }
      });
    });

    // Calculate averages
    stats.forEach((s) => {
      s.avgCostPerNight = s.nightsPlayed > 0 ? s.totalCost / s.nightsPlayed : 0;
    });

    return Array.from(stats.values()).sort((a, b) => b.totalCost - a.totalCost);
  });

  sortedByAvgCost = computed(() =>
    [...this.playerStats()]
      .filter((s) => s.nightsPlayed > 0)
      .sort((a, b) => a.avgCostPerNight - b.avgCostPerNight)
  );

  sortedByWins = computed(() =>
    [...this.playerStats()].sort((a, b) => b.wins - a.wins)
  );

  gameCounts = computed(() => {
    const counts = new Map<string, number>();
    this.allPlayedGames().forEach((games) => {
      games.forEach((pg) => {
        counts.set(pg.gameName, (counts.get(pg.gameName) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  });

  avgGamesPerNight = computed(() => {
    const nights = this.totalNights();
    return nights > 0 ? this.totalGamesPlayed() / nights : 0;
  });

  avgPlayersPerNight = computed(() => {
    const nights = this.gameNights();
    if (nights.length === 0) return 0;
    const totalPlayers = nights.reduce((sum, n) => sum + n.playerIds.length, 0);
    return totalPlayers / nights.length;
  });

  mostExpensivePlayer = computed(() => {
    const stats = this.playerStats();
    if (stats.length === 0) return '-';
    const max = stats.reduce((a, b) => (a.totalCost > b.totalCost ? a : b));
    return max.totalCost > 0 ? max.name : '-';
  });

  luckiestPlayer = computed(() => {
    const stats = this.playerStats().filter((s) => s.nightsPlayed > 0);
    if (stats.length === 0) return '-';
    const min = stats.reduce((a, b) => (a.totalCost < b.totalCost ? a : b));
    return min.name;
  });

  getBarWidth(cost: number): number {
    const maxCost = Math.max(...this.playerStats().map((s) => Math.abs(s.totalCost)), 1);
    return (Math.abs(cost) / maxCost) * 100;
  }

  getGameBarWidth(count: number): number {
    const maxCount = Math.max(...this.gameCounts().map((gc) => gc.count), 1);
    return (count / maxCount) * 100;
  }

  lastGameNight = computed(() => {
    const nights = this.gameNights();
    if (nights.length === 0) return null;
    return [...nights].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  });

  lastGameNightPlayedGames = computed(() => {
    const last = this.lastGameNight();
    if (!last) return [];
    return this.allPlayedGames().get(last.id) || [];
  });

  lastGameNightCosts = computed(() => {
    const last = this.lastGameNight();
    const games = this.lastGameNightPlayedGames();
    if (!last) return [];

    const playerTotals = new Map<string, number>();
    last.playerIds.forEach((pid) => playerTotals.set(pid, 0));

    games.forEach((g) => {
      Object.entries(g.costs).forEach(([pid, cost]) => {
        playerTotals.set(pid, (playerTotals.get(pid) || 0) + cost);
      });
    });

    return Array.from(playerTotals.entries())
      .map(([playerId, cost]) => ({
        playerId,
        name: this.players().find((p) => p.id === playerId)?.name || '?',
        cost,
      }))
      .sort((a, b) => a.cost - b.cost);
  });

  getGameWinners(game: PlayedGame): string {
    const scores = Object.entries(game.scores);
    if (scores.length === 0) return '-';

    const sorted = [...scores].sort((a, b) =>
      game.scoringSystem === 'highest' ? b[1] - a[1] : a[1] - b[1]
    );
    const bestScore = sorted[0][1];

    const winnerNames = scores
      .filter(([, score]) => score === bestScore)
      .map(([pid]) => this.players().find((p) => p.id === pid)?.name || '?');

    return winnerNames.join(' & ');
  }
}

import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GameService } from '../../core/services/game.service';
import { GameNightService } from '../../core/services/game-night.service';
import { PlayerService } from '../../core/services/player.service';
import { Game } from '../../core/models/game.model';
import { GameNight, PlayedGame } from '../../core/models/game-night.model';
import { Player } from '../../core/models/player.model';
import { Subscription } from 'rxjs';
import { GameDialogComponent } from './game-dialog';

@Component({
  selector: 'app-game-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTooltipModule
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Spiele</h1>
        <div class="header-actions">
          <mat-form-field appearance="outline" class="sort-field">
            <mat-label>Sortieren nach</mat-label>
            <mat-select [value]="sortBy()" (selectionChange)="sortBy.set($event.value)">
              <mat-option value="name">Name (A-Z)</mat-option>
              <mat-option value="playCount">Beliebtheit (Häufigkeit)</mat-option>
              <mat-option value="firstPlayed">Zuerst gespielt (Chronologisch)</mat-option>
            </mat-select>
          </mat-form-field>
          
          <button mat-fab extended (click)="openDialog()">
            <mat-icon>add</mat-icon>
            Spiel hinzufügen
          </button>
        </div>
      </div>

      @if (games().length === 0) {
        <div class="empty-state animate-scale-in">
          <div class="empty-icon">🎮</div>
          <div class="empty-title">Keine Spiele</div>
          <div class="empty-text">Füge dein erstes Spiel hinzu.</div>
        </div>
      } @else {
        <div class="card-grid">
          @for (game of sortedGames(); track game.id; let i = $index) {
            <div class="game-card-container" 
                 [class.flipped]="flippedGameId() === game.id" 
                 (click)="toggleFlip(game.id)"
                 [style.animation-delay]="i * 50 + 'ms'" 
                 style="animation: slideInUp 0.4s ease-out backwards">
              <div class="game-card-inner">
                
                <!-- Front Side -->
                <div class="game-card-front">
                  <!-- Play count badge in top-right corner -->
                  <div class="play-count-badge" matTooltip="Anzahl gespielter Partien" matTooltipPosition="above">
                    {{ getPlayCount(game.id) }}
                  </div>

                  <div class="game-header">
                    <div class="game-icon">🎲</div>
                    <div class="game-info">
                      <div class="game-name">{{ game.name }}</div>
                      <div class="game-badges">
                        <span class="chip-badge" [class.chip-highest]="game.scoringSystem === 'highest'" [class.chip-lowest]="game.scoringSystem === 'lowest'">
                          <mat-icon class="chip-icon">{{ game.scoringSystem === 'highest' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                          {{ game.scoringSystem === 'highest' ? 'Highest Wins' : 'Lowest Wins' }}
                        </span>
                        @if (game.isTeamGame) {
                          <span class="chip-badge chip-team">
                            <mat-icon class="chip-icon">groups</mat-icon>
                            Teamspiel
                          </span>
                        }
                        @if (getFirstPlayedDate(game.id)) {
                          <span class="chip-badge chip-first-play">
                            <mat-icon class="chip-icon">calendar_month</mat-icon>
                            Zuerst gespielt: {{ getFirstPlayedDate(game.id) | date:'dd.MM.yyyy' }}
                          </span>
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div class="front-footer-actions">
                    <button mat-icon-button (click)="deleteGame(game); $event.stopPropagation()" class="delete-btn" matTooltip="Spiel löschen">
                      <mat-icon>delete_outline</mat-icon>
                    </button>
                    <span class="info-tap-hint">Statistik anzeigen... 🔄</span>
                  </div>
                </div>
                
                <!-- Back Side -->
                <div class="game-card-back">
                  <div class="back-header">
                    <div class="back-title-container">
                      <span class="back-title">📈 Statistiken</span>
                      <span class="back-subtitle">{{ game.name }}</span>
                    </div>
                    <button mat-icon-button (click)="$event.stopPropagation(); toggleFlip(game.id)" class="close-back-btn" matTooltip="Zurück">
                      <mat-icon>undo</mat-icon>
                    </button>
                  </div>
                  
                  <div class="back-body" (click)="$event.stopPropagation()">
                    @if (getGamePlayerStats(game.id).length === 0) {
                      <div class="no-stats">
                        <div class="no-stats-icon">📊</div>
                        <div>Noch keine Partien gespielt.</div>
                      </div>
                    } @else {
                      <div class="ranking-list">
                        @for (stat of getGamePlayerStats(game.id); track stat.playerId; let idx = $index) {
                          <div class="ranking-row">
                            <div class="ranking-rank" [class.rank-1]="idx === 0" [class.rank-2]="idx === 1" [class.rank-3]="idx === 2">
                              {{ idx + 1 }}
                            </div>
                            <div class="player-avatar-mini">{{ stat.name.charAt(0).toUpperCase() }}</div>
                            <span class="player-name" [title]="stat.name">{{ stat.name }}</span>
                            <div class="spacer"></div>
                            <span class="avg-score-badge" [class.best-avg]="idx === 0">
                              Ø {{ stat.averageScore | number:'1.1-1' }}
                            </span>
                            <span class="play-count-hint">({{ stat.playCount }}x)</span>
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>

              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .sort-field {
      width: 200px;
      margin-bottom: -16px;
    }

    .game-card-container {
      perspective: 1200px;
      height: 180px;
      cursor: pointer;
      position: relative;
    }

    .game-card-inner {
      position: relative;
      width: 100%;
      height: 100%;
      transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
      transform-style: preserve-3d;
    }

    .game-card-container.flipped .game-card-inner {
      transform: rotateY(180deg);
    }

    .game-card-front, .game-card-back {
      position: absolute;
      width: 100%;
      height: 100%;
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      top: 0;
      left: 0;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border-radius: var(--radius-lg);
      backdrop-filter: blur(10px);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      transition: border-color var(--transition-normal), box-shadow var(--transition-normal);

      &:hover {
        transform: none !important;
      }
    }

    .game-card-front {
      background: var(--gradient-card);
    }

    .game-card-back {
      transform: rotateY(180deg);
      background: linear-gradient(135deg, rgba(20, 10, 45, 0.85), rgba(40, 15, 75, 0.85));
      border-color: rgba(139, 92, 246, 0.25);
    }

    .game-card-container:hover {
      .game-card-front {
        border-color: rgba(245, 158, 11, 0.2);
        box-shadow: var(--shadow-md), var(--shadow-glow);
      }
      .game-card-back {
        border-color: rgba(139, 92, 246, 0.4);
        box-shadow: var(--shadow-md), 0 0 15px rgba(139, 92, 246, 0.2);
      }
    }

    .play-count-badge {
      position: absolute;
      top: -10px;
      right: -10px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: linear-gradient(135deg, #c084fc, #8b5cf6);
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--color-bg-card);
      box-shadow: 0 0 10px rgba(139, 92, 246, 0.4);
      transition: transform var(--transition-fast);
      z-index: 2;

      &:hover {
        transform: scale(1.1);
      }
    }

    .game-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    .game-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      background: var(--color-bg-surface);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      flex-shrink: 0;
    }

    .game-name {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
      padding-right: 12px;
    }

    .game-badges {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .delete-btn {
      opacity: 0.5;
      transition: opacity var(--transition-fast), color var(--transition-fast);
      flex-shrink: 0;

      &:hover {
        opacity: 1;
        color: var(--color-danger);
      }
    }

    .front-footer-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      margin-top: auto;
    }

    .info-tap-hint {
      font-size: 11px;
      font-weight: 500;
      color: var(--color-text-muted);
      opacity: 0.7;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* Back components */
    .back-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 8px;
      margin-bottom: 8px;
    }

    .back-title-container {
      display: flex;
      flex-direction: column;
    }

    .back-title {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #c084fc;
      font-weight: 700;
    }

    .back-subtitle {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 180px;
    }

    .close-back-btn {
      margin-top: -4px;
      margin-right: -8px;
      color: var(--color-text-muted);
      
      &:hover {
        color: var(--color-text-primary);
        background: rgba(255, 255, 255, 0.05);
      }
    }

    .back-body {
      flex: 1;
      overflow-y: auto;
      margin-right: -4px;
      padding-right: 4px;

      &::-webkit-scrollbar {
        width: 4px;
      }
      &::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 2px;
      }
      &::-webkit-scrollbar-thumb {
        background: rgba(139, 92, 246, 0.3);
        border-radius: 2px;
      }
    }

    .ranking-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .ranking-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 6px;
      border-radius: var(--radius-sm);
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.02);

      &:hover {
        background: rgba(255, 255, 255, 0.04);
        border-color: rgba(255, 255, 255, 0.04);
      }
    }

    .ranking-rank {
      font-size: 11px;
      font-weight: 700;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.1);
      color: var(--color-text-secondary);

      &.rank-1 {
        background: linear-gradient(135deg, #fbbf24, #d97706);
        color: #000000;
      }
      &.rank-2 {
        background: linear-gradient(135deg, #9ca3af, #4b5563);
        color: #ffffff;
      }
      &.rank-3 {
        background: linear-gradient(135deg, #b45309, #78350f);
        color: #ffffff;
      }
    }

    .player-avatar-mini {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      color: var(--color-text-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
    }

    .player-name {
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100px;
    }

    .spacer {
      flex: 1;
    }

    .avg-score-badge {
      font-size: 12px;
      font-weight: 700;
      color: var(--color-text-secondary);
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.04);

      &.best-avg {
        color: #fbbf24;
        background: rgba(251, 191, 36, 0.1);
      }
    }

    .play-count-hint {
      font-size: 11px;
      color: var(--color-text-muted);
      min-width: 28px;
      text-align: right;
    }

    .no-stats {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 90px;
      color: var(--color-text-muted);
      font-size: 12px;
    }

    .no-stats-icon {
      font-size: 20px;
      opacity: 0.6;
    }
  `,
})
export class GameListComponent implements OnInit, OnDestroy {
  private gameService = inject(GameService);
  private gameNightService = inject(GameNightService);
  private playerService = inject(PlayerService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  games = signal<Game[]>([]);
  gameNights = signal<GameNight[]>([]);
  players = signal<Player[]>([]);
  allPlayedGames = signal<Map<string, PlayedGame[]>>(new Map());
  flippedGameId = signal<string | null>(null);
  private subscriptions: Subscription[] = [];

  sortBy = signal<'name' | 'playCount' | 'firstPlayed'>('name');

  sortedGames = computed(() => {
    const list = [...this.games()];
    const sortOrder = this.sortBy();

    if (sortOrder === 'name') {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === 'playCount') {
      return list.sort((a, b) => {
        const countA = this.getPlayCount(a.id);
        const countB = this.getPlayCount(b.id);
        return countB - countA;
      });
    } else if (sortOrder === 'firstPlayed') {
      return list.sort((a, b) => {
        const dateA = this.getFirstPlayedDate(a.id);
        const dateB = this.getFirstPlayedDate(b.id);

        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;

        return new Date(dateA).getTime() - new Date(dateB).getTime();
      });
    }
    return list;
  });

  ngOnInit() {
    const sub1 = this.gameService.getAll().subscribe((games) => {
      this.games.set(games);
    });

    const sub2 = this.gameNightService.getAll().subscribe((gn) => {
      this.gameNights.set(gn);
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

    const sub3 = this.playerService.getAll().subscribe((players) => {
      this.players.set(players);
    });

    this.subscriptions.push(sub1, sub2, sub3);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  gameStats = computed(() => {
    const statsMap = new Map<string, { count: number; firstPlayed: string | null }>();

    this.games().forEach((game) => {
      statsMap.set(game.id, { count: 0, firstPlayed: null });
    });

    this.gameNights().forEach((night) => {
      const played = this.allPlayedGames().get(night.id) || [];
      played.forEach((pg) => {
        const stat = statsMap.get(pg.gameId);
        if (stat) {
          stat.count++;
          const nightDate = night.date;
          if (nightDate) {
            if (!stat.firstPlayed || new Date(nightDate).getTime() < new Date(stat.firstPlayed).getTime()) {
              stat.firstPlayed = nightDate;
            }
          }
        }
      });
    });

    return statsMap;
  });

  gamePlayerStats = computed(() => {
    const games = this.games();
    const nights = this.gameNights();
    const played = this.allPlayedGames();
    const players = this.players();

    const statsMap = new Map<string, Array<{
      playerId: string;
      name: string;
      playCount: number;
      averageScore: number;
    }>>();

    games.forEach((game) => {
      const playerMap = new Map<string, { totalScore: number; playCount: number }>();
      
      nights.forEach((night) => {
        const playedGames = played.get(night.id) || [];
        playedGames.forEach((pg) => {
          if (pg.gameId === game.id) {
            Object.entries(pg.scores).forEach(([playerId, score]) => {
              const current = playerMap.get(playerId) || { totalScore: 0, playCount: 0 };
              playerMap.set(playerId, {
                totalScore: current.totalScore + score,
                playCount: current.playCount + 1,
              });
            });
          }
        });
      });

      const list = Array.from(playerMap.entries()).map(([playerId, stats]) => {
        const player = players.find((p) => p.id === playerId);
        return {
          playerId,
          name: player ? player.name : '?',
          playCount: stats.playCount,
          averageScore: stats.totalScore / stats.playCount,
        };
      });

      if (game.scoringSystem === 'highest') {
        list.sort((a, b) => b.averageScore - a.averageScore);
      } else {
        list.sort((a, b) => a.averageScore - b.averageScore);
      }

      statsMap.set(game.id, list);
    });

    return statsMap;
  });

  getPlayCount(gameId: string): number {
    return this.gameStats().get(gameId)?.count || 0;
  }

  getFirstPlayedDate(gameId: string): string | null {
    return this.gameStats().get(gameId)?.firstPlayed || null;
  }

  getGamePlayerStats(gameId: string) {
    return this.gamePlayerStats().get(gameId) || [];
  }

  toggleFlip(gameId: string) {
    if (this.flippedGameId() === gameId) {
      this.flippedGameId.set(null);
    } else {
      this.flippedGameId.set(gameId);
    }
  }

  openDialog() {
    const dialogRef = this.dialog.open(GameDialogComponent, {
      width: '100%',
      maxWidth: '450px',
    });

    dialogRef.afterClosed().subscribe((result: { name: string; scoringSystem: string; isTeamGame: boolean } | undefined) => {
      if (result) {
        this.gameService.create(result.name, result.scoringSystem as 'highest' | 'lowest', result.isTeamGame).then(() => {
          this.snackBar.open('Spiel hinzugefügt!', 'OK', { duration: 2000 });
        });
      }
    });
  }

  deleteGame(game: Game) {
    this.gameService.delete(game.id).then(() => {
      this.snackBar.open(`${game.name} gelöscht`, 'OK', { duration: 2000 });
    });
  }
}

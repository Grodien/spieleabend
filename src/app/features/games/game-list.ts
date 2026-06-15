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
import { GameNightCacheService } from '../../core/services/game-night-cache.service';
import { Game } from '../../core/models/game.model';
import { GameNight } from '../../core/models/game-night.model';
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
            <div class="glass-card game-card" 
                 [class.showing-stats]="flippedGameId() === game.id" 
                 (click)="toggleFlip(game.id)"
                 [style.animation-delay]="i * 50 + 'ms'" 
                 style="animation: slideInUp 0.4s ease-out backwards">
              
              @if (flippedGameId() !== game.id) {
                <!-- Front Side / General Info -->
                <div class="card-content-front">
                  <!-- Play count badge -->
                  <div class="play-count-badge" matTooltip="Anzahl gespielter Partien" matTooltipPosition="above">
                    {{ getPlayCount(game.id) }} Partien
                  </div>

                  <div class="game-main-info">
                    <div class="game-icon-title">
                      <span class="game-emoji">🎲</span>
                      <span class="game-title">{{ game.name }}</span>
                    </div>
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
                    </div>
                  </div>
                  
                  <div class="game-footer">
                    @if (getFirstPlayedDate(game.id)) {
                      <span class="first-played-text">
                        <mat-icon class="footer-icon">calendar_month</mat-icon>
                        Erste Partie: {{ getFirstPlayedDate(game.id) | date:'dd.MM.yyyy' }}
                      </span>
                    } @else {
                      <span class="first-played-text unplayed">
                        <mat-icon class="footer-icon">hourglass_empty</mat-icon>
                        Noch nie gespielt
                      </span>
                    }
                    <button mat-icon-button
                            (click)="deleteGame(game); $event.stopPropagation()"
                            class="delete-btn"
                            [disabled]="getPlayCount(game.id) > 0"
                            [matTooltip]="getPlayCount(game.id) > 0 ? 'Gespielte Spiele können nicht gelöscht werden' : 'Spiel löschen'">
                      <mat-icon>delete_outline</mat-icon>
                    </button>
                  </div>
                </div>
              } @else {
                <!-- Back Side / Player Stats (No stop propagation to allow flip back on card tap) -->
                <div class="card-content-back">
                  <div class="back-header">
                    <div class="back-title-container">
                      <span class="back-title">📈 Statistiken</span>
                      <span class="back-subtitle">{{ game.name }}</span>
                    </div>
                    <span class="tap-back-hint">Tippen zum Schließen ↩</span>
                  </div>
                  
                  <div class="back-body">
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
              }

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

    .game-card {
      height: 160px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      cursor: pointer;
      padding: 20px;
      transition: height 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), border-color var(--transition-normal), box-shadow var(--transition-normal);
      animation: slideInUp 0.4s ease-out backwards;
      overflow: hidden;

      &.showing-stats {
        height: 290px;
        background: linear-gradient(135deg, rgba(20, 10, 45, 0.85), rgba(30, 15, 50, 0.85));
        border-color: rgba(139, 92, 246, 0.35);

        &:hover {
          border-color: rgba(139, 92, 246, 0.5);
          box-shadow: var(--shadow-md), 0 0 15px rgba(139, 92, 246, 0.2);
        }
      }
    }

    .card-content-front, .card-content-back {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 100%;
      height: 100%;
      flex-grow: 1;
      animation: cardFadeIn 0.2s ease-out;
    }

    @keyframes cardFadeIn {
      from {
        opacity: 0;
        transform: scale(0.98);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    /* Overrides to prevent flickering of inner elements */
    .chip-badge:hover {
      transform: none !important;
      box-shadow: none !important;
    }

    /* Play count badge */
    .play-count-badge {
      position: absolute;
      top: 14px;
      right: 18px;
      padding: 3px 8px;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(192, 132, 252, 0.12), rgba(139, 92, 246, 0.12));
      border: 1px solid rgba(139, 92, 246, 0.2);
      color: #c084fc;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }

    /* Header & Title */
    .game-main-info {
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex-grow: 1;
      justify-content: center;
      margin-bottom: 12px;
    }

    .game-icon-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .game-emoji {
      font-size: 24px;
    }

    .game-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--color-text-primary);
      letter-spacing: -0.01em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 200px;
    }

    .game-badges {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    /* Footer actions */
    .game-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 10px;
      margin-top: 6px;
    }

    .first-played-text {
      font-size: 11px;
      color: var(--color-text-muted);
      display: flex;
      align-items: center;
      gap: 4px;

      .footer-icon {
        font-size: 13px !important;
        width: 13px !important;
        height: 13px !important;
        color: rgba(255, 255, 255, 0.4);
      }

      &.unplayed {
        color: rgba(255, 255, 255, 0.3);
      }
    }

    .delete-btn {
      color: var(--color-text-muted);
      opacity: 0.4;
      transition: opacity 0.2s ease, color 0.2s ease, background 0.2s ease;
      margin-bottom: -6px;
      margin-right: -10px;

      &:hover {
        opacity: 1 !important;
        color: var(--color-danger) !important;
        background: rgba(239, 68, 68, 0.08) !important;
      }
    }

    .game-card:hover .delete-btn {
      opacity: 0.6;
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

    .tap-back-hint {
      font-size: 10px;
      color: var(--color-text-muted);
      opacity: 0.6;
      font-weight: 500;
      align-self: center;
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

    @media (max-width: 600px) {
      .header-actions {
        flex-direction: column;
        align-items: stretch;
        width: 100%;
        gap: 12px;
      }

      .sort-field {
        width: 100%;
        margin-bottom: 0;
      }
    }
  `,
})
export class GameListComponent implements OnInit, OnDestroy {
  private gameService = inject(GameService);
  private cache = inject(GameNightCacheService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  games = signal<Game[]>([]);
  // Use cache signals directly
  readonly gameNights = this.cache.gameNights;
  readonly players = this.cache.players;

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
    this.cache.initialize();

    const sub1 = this.gameService.getAll().subscribe((games) => {
      this.games.set(games);
    });

    this.subscriptions.push(sub1);
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
      (night.playedGames ?? []).forEach((pg) => {
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
        (night.playedGames ?? []).forEach((pg) => {
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
    if (this.getPlayCount(game.id) > 0) {
      this.snackBar.open('Gespielte Spiele können nicht gelöscht werden.', 'OK', { duration: 3000 });
      return;
    }
    if (confirm(`Möchtest du das Spiel "${game.name}" wirklich löschen?`)) {
      this.gameService.delete(game.id).then(() => {
        this.snackBar.open(`${game.name} gelöscht`, 'OK', { duration: 2000 });
      });
    }
  }
}

import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GameNightService } from '../../core/services/game-night.service';
import { PlayerService } from '../../core/services/player.service';
import { GameService } from '../../core/services/game.service';
import { CostCalculatorService } from '../../core/services/cost-calculator.service';
import { GameNight, PlayedGame } from '../../core/models/game-night.model';
import { Player } from '../../core/models/player.model';
import { Game } from '../../core/models/game.model';
import { AddGameDialogComponent } from './add-game-dialog';

@Component({
  selector: 'app-game-night-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink, MatButtonModule, MatIconModule,
    MatDialogModule, MatSnackBarModule, MatTableModule, MatTooltipModule,
    DatePipe, DecimalPipe,
  ],
  template: `
    <div class="page-container">
      @if (gameNight()) {
        <div class="page-header">
          <div class="header-left">
            <a routerLink="/game-nights" class="back-btn" mat-icon-button>
              <mat-icon>arrow_back</mat-icon>
            </a>
            <div>
              <h1>Spieleabend {{ gameNight()!.date | date:'dd.MM.yyyy' }}</h1>
              <div class="header-meta">
                <span class="meta-badge">
                  <mat-icon class="meta-icon-sm">group</mat-icon>
                  {{ gameNight()!.playerIds.length }} Spieler
                </span>
                <span class="meta-badge">
                  <mat-icon class="meta-icon-sm">payments</mat-icon>
                  {{ gameNight()!.costPerGame }}.- CHF / Spiel
                </span>
              </div>
            </div>
          </div>
          <button mat-fab extended (click)="openAddGameDialog()">
            <mat-icon>add</mat-icon>
            Spiel hinzufügen
          </button>
        </div>

        <!-- Player Cost Summary -->
        @if (playedGames().length > 0) {
          <div class="cost-summary glass-card animate-slide-in" style="margin-bottom: 24px;">
            <h3 class="section-title">💰 Kostenübersicht</h3>
            <div class="cost-grid">
              @for (entry of totalCosts(); track entry.playerId) {
                <div class="cost-item">
                  <div class="cost-player-avatar">{{ getPlayerName(entry.playerId).charAt(0).toUpperCase() }}</div>
                  <div class="cost-player-name">{{ getPlayerName(entry.playerId) }}</div>
                  <div class="cost-value" [class.cost-positive]="entry.cost > 0">
                    {{ entry.cost | number:'1.2-2' }} CHF
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Played Games -->
        @if (playedGames().length === 0) {
          <div class="empty-state animate-scale-in">
            <div class="empty-icon">🎯</div>
            <div class="empty-title">Noch keine Spiele</div>
            <div class="empty-text">Füge ein Spiel zum Spieleabend hinzu und trage die Scores ein.</div>
          </div>
        } @else {
          <div class="games-section">
            @for (pg of playedGames(); track pg.id; let i = $index) {
              <div class="glass-card game-result-card" [style.animation-delay]="i * 80 + 'ms'" style="animation: slideInUp 0.4s ease-out backwards">
                <div class="game-result-header">
                  <div class="game-result-info">
                    <span class="game-result-name">{{ pg.gameName }}</span>
                    <div class="game-result-badges">
                      <span class="chip-badge" [class.chip-highest]="pg.scoringSystem === 'highest'" [class.chip-lowest]="pg.scoringSystem === 'lowest'">
                        <mat-icon class="chip-icon">{{ pg.scoringSystem === 'highest' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                        {{ pg.scoringSystem === 'highest' ? 'Highest Wins' : 'Lowest Wins' }}
                      </span>
                      @if (pg.isTeamGame) {
                        <span class="chip-badge chip-team">
                          <mat-icon class="chip-icon">groups</mat-icon>
                          Teamspiel
                        </span>
                      }
                    </div>
                  </div>
                  <button mat-icon-button (click)="deletePlayedGame(pg)" class="delete-btn"
                          matTooltip="Spiel entfernen">
                    <mat-icon>delete_outline</mat-icon>
                  </button>
                </div>

                <div class="score-table">
                  <div class="score-header-row">
                    <span class="score-col rank-col">Rang</span>
                    <span class="score-col player-col">Spieler</span>
                    <span class="score-col score-val-col">Score</span>
                    <span class="score-col cost-col">Kosten</span>
                  </div>
                  @for (entry of getSortedScores(pg); track entry.playerId) {
                    <div class="score-row" [class.winner-row]="entry.rank === 1">
                      <span class="score-col rank-col">
                        @if (entry.rank === 1) {
                          🏆
                        } @else {
                          {{ entry.rank }}.
                        }
                      </span>
                      <span class="score-col player-col">{{ getPlayerName(entry.playerId) }}</span>
                      <span class="score-col score-val-col">{{ entry.score }}</span>
                      <span class="score-col cost-col" [class.cost-zero]="entry.cost === 0" [class.cost-positive]="entry.cost > 0">
                        {{ entry.cost | number:'1.2-2' }} CHF
                      </span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      } @else {
        <div class="loading-state">Laden...</div>
      }
    </div>
  `,
  styles: `
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .back-btn {
      color: var(--color-text-secondary);
    }

    .header-meta {
      display: flex;
      gap: 12px 16px;
      margin-top: 6px;
      flex-wrap: wrap;
    }

    .meta-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: var(--color-text-secondary);
    }

    .meta-icon-sm {
      font-size: 15px !important;
      width: 15px !important;
      height: 15px !important;
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 16px;
    }

    .cost-summary {
      overflow-x: auto;
    }

    .cost-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px;
      width: 100%;
    }

    .cost-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: var(--radius-md);
      background: var(--color-bg-surface);
      min-width: 0;
    }

    .cost-player-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--gradient-accent);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
      color: #000;
      flex-shrink: 0;
    }

    .cost-player-name {
      font-weight: 500;
      font-size: 14px;
      flex: 1;
    }

    .cost-value {
      font-weight: 700;
      font-size: 14px;
      color: var(--color-text-primary);
    }

    .cost-positive {
      color: var(--color-danger) !important;
    }

    .cost-zero {
      color: var(--color-success) !important;
    }

    .games-section {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .game-result-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .game-result-name {
      font-size: 18px;
      font-weight: 600;
    }

    .game-result-badges {
      display: flex;
      gap: 8px;
      margin-top: 6px;
    }

    .score-table {
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .score-header-row {
      display: flex;
      padding: 10px 16px;
      background: var(--color-bg-surface);
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-secondary);
    }

    .score-row {
      display: flex;
      padding: 12px 16px;
      border-bottom: 1px solid var(--color-border);
      transition: background var(--transition-fast);

      &:hover {
        background: rgba(255, 255, 255, 0.02);
      }

      &:last-child {
        border-bottom: none;
      }
    }

    .winner-row {
      background: rgba(245, 158, 11, 0.05);
    }

    .score-col {
      display: flex;
      align-items: center;
    }

    .rank-col {
      width: 60px;
      font-weight: 600;
    }

    .player-col {
      flex: 1;
      font-weight: 500;
    }

    .score-val-col {
      width: 80px;
      justify-content: flex-end;
      color: var(--color-text-secondary);
    }

    .cost-col {
      width: 100px;
      justify-content: flex-end;
      font-weight: 600;
    }

    .delete-btn {
      opacity: 0.5;
      transition: opacity var(--transition-fast), color var(--transition-fast);

      &:hover {
        opacity: 1;
        color: var(--color-danger);
      }
    }

    .loading-state {
      text-align: center;
      padding: 64px;
      color: var(--color-text-muted);
      font-size: 16px;
    }

    @media (max-width: 600px) {
      .score-header-row, .score-row {
        padding: 10px 8px;
        font-size: 13px;
      }
      
      .rank-col {
        width: 40px;
      }
      
      .score-val-col {
        width: 60px;
      }
      
      .cost-col {
        width: 85px;
      }
    }
  `,
})
export class GameNightDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private gameNightService = inject(GameNightService);
  private playerService = inject(PlayerService);
  private gameService = inject(GameService);
  private costCalculator = inject(CostCalculatorService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  gameNight = signal<GameNight | null>(null);
  playedGames = signal<PlayedGame[]>([]);
  private playerMap = signal<Map<string, string>>(new Map());
  private games = signal<Game[]>([]);

  totalCosts = computed(() => {
    const gn = this.gameNight();
    if (!gn) return [];

    const playerTotals = new Map<string, number>();
    gn.playerIds.forEach((id) => playerTotals.set(id, 0));

    this.playedGames().forEach((pg) => {
      Object.entries(pg.costs).forEach(([playerId, cost]) => {
        playerTotals.set(playerId, (playerTotals.get(playerId) || 0) + cost);
      });
    });

    return Array.from(playerTotals.entries())
      .map(([playerId, cost]) => ({ playerId, cost }))
      .sort((a, b) => a.cost - b.cost);
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;

    this.playerService.getAll().subscribe((players) => {
      const map = new Map<string, string>();
      players.forEach((p) => map.set(p.id, p.name));
      this.playerMap.set(map);
    });

    this.gameService.getAll().subscribe((games) => {
      this.games.set(games);
    });

    this.gameNightService.getById(id).subscribe((gn) => {
      this.gameNight.set(gn ?? null);
    });

    this.gameNightService.getPlayedGames(id).subscribe((pg) => {
      this.playedGames.set(pg);
    });
  }

  getPlayerName(playerId: string): string {
    return this.playerMap().get(playerId) || '?';
  }

  getSortedScores(pg: PlayedGame): Array<{ playerId: string; score: number; cost: number; rank: number }> {
    const entries = Object.entries(pg.scores).map(([playerId, score]) => ({
      playerId,
      score,
      cost: pg.costs[playerId] || 0,
      rank: 0,
    }));

    // Sort by score according to scoring system
    entries.sort((a, b) =>
      pg.scoringSystem === 'highest' ? b.score - a.score : a.score - b.score
    );

    // Assign ranks
    let currentRank = 1;
    for (let i = 0; i < entries.length; i++) {
      if (i > 0 && entries[i].score !== entries[i - 1].score) {
        currentRank = i + 1;
      }
      entries[i].rank = currentRank;
    }

    return entries;
  }

  openAddGameDialog() {
    const gn = this.gameNight();
    if (!gn) return;

    const dialogRef = this.dialog.open(AddGameDialogComponent, {
      width: '100%',
      maxWidth: '500px',
      data: {
        games: this.games(),
        playerIds: gn.playerIds,
        playerMap: this.playerMap(),
      },
    });

    dialogRef.afterClosed().subscribe((result: { gameId: string; scores: Record<string, number> } | undefined) => {
      if (result && gn) {
        const game = this.games().find((g) => g.id === result.gameId);
        if (!game) return;

        const costs = this.costCalculator.calculateCosts(
          result.scores,
          game.scoringSystem,
          game.isTeamGame,
          gn.costPerGame,
        );

        this.gameNightService
          .addPlayedGame(gn.id, {
            gameId: game.id,
            gameName: game.name,
            isTeamGame: game.isTeamGame,
            scoringSystem: game.scoringSystem,
            scores: result.scores,
            costs,
          })
          .then(() => {
            this.snackBar.open(`${game.name} hinzugefügt!`, 'OK', { duration: 2000 });
          });
      }
    });
  }

  deletePlayedGame(pg: PlayedGame) {
    const gn = this.gameNight();
    if (!gn) return;

    this.gameNightService.deletePlayedGame(gn.id, pg.id).then(() => {
      this.snackBar.open(`${pg.gameName} entfernt`, 'OK', { duration: 2000 });
    });
  }
}

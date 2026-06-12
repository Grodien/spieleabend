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
import { Game } from '../../core/models/game.model';
import { GameNight, PlayedGame } from '../../core/models/game-night.model';
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
            <div class="glass-card game-card" [style.animation-delay]="i * 50 + 'ms'" style="animation: slideInUp 0.4s ease-out backwards">
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
              <button mat-icon-button (click)="deleteGame(game)" class="delete-btn">
                <mat-icon>delete_outline</mat-icon>
              </button>
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
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      position: relative;
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
  `,
})
export class GameListComponent implements OnInit, OnDestroy {
  private gameService = inject(GameService);
  private gameNightService = inject(GameNightService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  games = signal<Game[]>([]);
  gameNights = signal<GameNight[]>([]);
  allPlayedGames = signal<Map<string, PlayedGame[]>>(new Map());
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
        if (!dateA) return 1; // Put unplayed games at the end
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

    this.subscriptions.push(sub1, sub2);
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

  getPlayCount(gameId: string): number {
    return this.gameStats().get(gameId)?.count || 0;
  }

  getFirstPlayedDate(gameId: string): string | null {
    return this.gameStats().get(gameId)?.firstPlayed || null;
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

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GameNightService } from '../../core/services/game-night.service';
import { PlayerService } from '../../core/services/player.service';
import { GameNight } from '../../core/models/game-night.model';
import { Player } from '../../core/models/player.model';

@Component({
  selector: 'app-game-night-list',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatSnackBarModule, DatePipe],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Spieleabende</h1>
        <button mat-fab extended [routerLink]="['/game-nights/new']">
          <mat-icon>add</mat-icon>
          Neuer Spieleabend
        </button>
      </div>

      @if (gameNights().length === 0) {
        <div class="empty-state animate-scale-in">
          <div class="empty-icon">🌙</div>
          <div class="empty-title">Keine Spieleabende</div>
          <div class="empty-text">Erstelle deinen ersten Spieleabend!</div>
        </div>
      } @else {
        <div class="nights-list">
          @for (night of gameNights(); track night.id; let i = $index) {
            <a [routerLink]="['/game-nights', night.id]" class="glass-card night-card" [style.animation-delay]="i * 60 + 'ms'" style="animation: slideInUp 0.4s ease-out backwards">
              <div class="night-date-badge">
                <div class="date-day">{{ night.date | date:'dd' }}</div>
                <div class="date-month">{{ night.date | date:'MMM' }}</div>
                <div class="date-year">{{ night.date | date:'yyyy' }}</div>
              </div>
              <div class="night-info">
                <div class="night-title">Spieleabend</div>
                <div class="night-meta">
                  <span class="meta-item">
                    <mat-icon class="meta-icon">group</mat-icon>
                    {{ night.playerIds.length }} Spieler
                  </span>
                  <span class="meta-item">
                    <mat-icon class="meta-icon">payments</mat-icon>
                    {{ night.costPerGame }}.- CHF / Spiel
                  </span>
                </div>
                <div class="night-players">
                  @for (playerId of night.playerIds.slice(0, 5); track playerId) {
                    <span class="player-chip">{{ getPlayerName(playerId) }}</span>
                  }
                  @if (night.playerIds.length > 5) {
                    <span class="player-chip more-chip">+{{ night.playerIds.length - 5 }}</span>
                  }
                </div>
              </div>
              <div class="night-arrow">
                <mat-icon>chevron_right</mat-icon>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .nights-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .night-card {
      display: flex;
      align-items: center;
      gap: 24px;
      text-decoration: none;
      color: inherit;
      cursor: pointer;
    }

    .night-date-badge {
      width: 72px;
      min-width: 72px;
      text-align: center;
      padding: 12px 8px;
      background: var(--color-bg-surface);
      border-radius: var(--radius-md);
    }

    .date-day {
      font-size: 28px;
      font-weight: 800;
      line-height: 1;
      background: var(--gradient-accent);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .date-month {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--color-text-secondary);
      margin-top: 2px;
    }

    .date-year {
      font-size: 11px;
      color: var(--color-text-muted);
    }

    .night-info {
      flex: 1;
    }

    .night-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 6px;
    }

    .night-meta {
      display: flex;
      gap: 16px;
      margin-bottom: 10px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: var(--color-text-secondary);
    }

    .meta-icon {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
    }

    .night-players {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .player-chip {
      padding: 2px 10px;
      border-radius: 100px;
      font-size: 12px;
      font-weight: 500;
      background: rgba(245, 158, 11, 0.1);
      color: var(--color-accent-light);
      border: 1px solid rgba(245, 158, 11, 0.2);
    }

    .more-chip {
      background: var(--color-bg-surface);
      color: var(--color-text-secondary);
      border-color: var(--color-border);
    }

    .night-arrow {
      color: var(--color-text-muted);
      transition: color var(--transition-fast);
    }

    .night-card:hover .night-arrow {
      color: var(--color-accent);
    }
  `,
})
export class GameNightListComponent implements OnInit {
  private gameNightService = inject(GameNightService);
  private playerService = inject(PlayerService);
  private snackBar = inject(MatSnackBar);

  gameNights = signal<GameNight[]>([]);
  private playerMap = signal<Map<string, string>>(new Map());

  ngOnInit() {
    this.playerService.getAll().subscribe((players) => {
      const map = new Map<string, string>();
      players.forEach((p) => map.set(p.id, p.name));
      this.playerMap.set(map);
    });

    this.gameNightService.getAll().subscribe((nights) => {
      this.gameNights.set(nights.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      }));
    });
  }

  getPlayerName(playerId: string): string {
    return this.playerMap().get(playerId) || '?';
  }
}

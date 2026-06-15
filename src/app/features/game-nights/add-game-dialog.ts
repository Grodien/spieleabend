import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Game } from '../../core/models/game.model';
import { PlayedGame } from '../../core/models/game-night.model';

interface DialogData {
  games: Game[];
  playerIds: string[];
  playerMap: Map<string, string>;
  playedGame?: PlayedGame;
}

@Component({
  selector: 'app-add-game-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatIconModule,
    MatCheckboxModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.playedGame ? 'Spielergebnisse bearbeiten' : 'Spiel hinzufügen' }}</h2>
    <mat-dialog-content>
      @if (data.playedGame) {
        <div class="game-info-row">
          <span class="game-info-label">Spiel:</span>
          <span class="game-info-value">{{ data.playedGame.gameName }}</span>
        </div>
      } @else {
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Spiel suchen oder auswählen</mat-label>
          <input type="text"
                 placeholder="Spiel suchen..."
                 matInput
                 [(ngModel)]="selectedGame"
                 (ngModelChange)="onSearchChange($event)"
                 [matAutocomplete]="auto" />
          <mat-autocomplete #auto="matAutocomplete" [displayWith]="displayGameName">
            @for (game of filteredGames(); track game.id) {
              <mat-option [value]="game">
                {{ game.name }}
                @if (game.isTeamGame) { (Team) }
              </mat-option>
            }
          </mat-autocomplete>
        </mat-form-field>
      }

      @if (selectedGameId) {
        <div class="scores-section">
          <h3 class="scores-title">Mitspieler & Scores</h3>
          @for (playerId of data.playerIds; track playerId) {
            <div class="player-score-row">
              <mat-checkbox [checked]="isPlaying[playerId]"
                            (change)="togglePlayerParticipation(playerId)">
                {{ getPlayerName(playerId) }}
              </mat-checkbox>
              @if (isPlaying[playerId]) {
                <mat-form-field appearance="outline" class="score-input-field">
                  <mat-label>Score</mat-label>
                  <input matInput
                         type="number"
                         [(ngModel)]="scores[playerId]"
                         placeholder="Score" />
                </mat-form-field>
              } @else {
                <div class="dnp-placeholder">Ausgesetzt</div>
              }
            </div>
          }
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Abbrechen</button>
      <button mat-flat-button color="primary"
              [disabled]="!canSave()"
              (click)="save()">
        Speichern
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .full-width {
      width: 100%;
    }

    .game-info-row {
      display: flex;
      gap: 8px;
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 20px;
      padding: 12px 16px;
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      align-items: center;
    }

    .game-info-label {
      color: var(--color-text-secondary);
    }

    .game-info-value {
      color: var(--color-text-primary);
      font-weight: 600;
    }

    .scores-section {
      margin-top: 8px;
    }

    .scores-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
      color: var(--color-text-secondary);
    }

    .player-score-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 12px;
      padding: 4px 12px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      height: 64px;
    }

    .score-input-field {
      width: 120px;
      margin-bottom: 0 !important;
    }

    .dnp-placeholder {
      font-size: 13px;
      font-weight: 500;
      color: var(--color-text-muted);
      width: 120px;
      text-align: right;
      padding-right: 16px;
      line-height: 48px;
    }
  `,
})
export class AddGameDialogComponent {
  data = inject<DialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<AddGameDialogComponent>);

  selectedGame: string | Game = '';
  selectedGameId = '';
  scores: Record<string, number> = {};
  searchQuery = signal('');
  isPlaying: Record<string, boolean> = {};

  constructor() {
    const pg = this.data.playedGame;
    // Set all players to active by default
    this.data.playerIds.forEach((id) => {
      this.isPlaying[id] = true;
    });

    if (pg) {
      const game = this.data.games.find((g) => g.id === pg.gameId);
      if (game) {
        this.selectedGame = game;
        this.selectedGameId = game.id;
      }
      this.scores = { ...pg.scores };
      
      // Update isPlaying based on whether the player had a score in pg.scores
      this.data.playerIds.forEach((id) => {
        this.isPlaying[id] = id in pg.scores;
      });
    } else {
      // Initialize scores to 0 for all players
      this.data.playerIds.forEach((id) => {
        this.scores[id] = 0;
      });
    }
  }

  filteredGames = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.data.games;
    return this.data.games.filter((game) =>
      game.name.toLowerCase().includes(query)
    );
  });

  onSearchChange(value: string | Game) {
    const query = typeof value === 'string' ? value : (value?.name || '');
    this.searchQuery.set(query);

    if (typeof value === 'string') {
      this.selectedGameId = '';
    } else if (value && value.id) {
      this.selectedGameId = value.id;
      this.onGameChange();
    }
  }

  displayGameName(game: Game | null): string {
    return game ? game.name : '';
  }

  onGameChange() {
    // Reset scores and active players when game changes
    this.scores = {};
    this.data.playerIds.forEach((id) => {
      this.isPlaying[id] = true;
      this.scores[id] = 0;
    });
  }

  togglePlayerParticipation(playerId: string) {
    this.isPlaying[playerId] = !this.isPlaying[playerId];
    if (this.isPlaying[playerId]) {
      this.scores[playerId] = 0;
    } else {
      delete this.scores[playerId];
    }
  }

  getPlayerName(playerId: string): string {
    return this.data.playerMap.get(playerId) || '?';
  }

  canSave(): boolean {
    if (!this.selectedGameId) return false;
    
    // At least 1 player must play (practically, we need players to save a game)
    const activeCount = this.data.playerIds.filter((id) => this.isPlaying[id]).length;
    if (activeCount === 0) return false;

    // Check all active players have scores
    return this.data.playerIds.every(
      (id) => !this.isPlaying[id] || (this.scores[id] !== undefined && this.scores[id] !== null),
    );
  }

  save() {
    if (!this.canSave()) return;

    // Filter scores to only include participating players
    const filteredScores: Record<string, number> = {};
    this.data.playerIds.forEach((id) => {
      if (this.isPlaying[id]) {
        filteredScores[id] = this.scores[id];
      }
    });

    this.dialogRef.close({
      gameId: this.selectedGameId,
      scores: filteredScores,
    });
  }
}

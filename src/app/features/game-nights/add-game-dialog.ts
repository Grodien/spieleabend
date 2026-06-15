import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
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
          <h3 class="scores-title">Scores eingeben</h3>
          @for (playerId of data.playerIds; track playerId) {
            <mat-form-field appearance="outline" class="full-width score-field">
              <mat-label>{{ getPlayerName(playerId) }}</mat-label>
              <input matInput type="number" [(ngModel)]="scores[playerId]" placeholder="Score" />
            </mat-form-field>
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

    .score-field {
      margin-bottom: 4px;
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

  constructor() {
    const pg = this.data.playedGame;
    if (pg) {
      const game = this.data.games.find((g) => g.id === pg.gameId);
      if (game) {
        this.selectedGame = game;
        this.selectedGameId = game.id;
      }
      this.scores = { ...pg.scores };
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
    // Reset scores when game changes
    this.scores = {};
    this.data.playerIds.forEach((id) => {
      this.scores[id] = 0;
    });
  }

  getPlayerName(playerId: string): string {
    return this.data.playerMap.get(playerId) || '?';
  }

  canSave(): boolean {
    if (!this.selectedGameId) return false;
    // Check all players have scores
    return this.data.playerIds.every(
      (id) => this.scores[id] !== undefined && this.scores[id] !== null,
    );
  }

  save() {
    if (!this.canSave()) return;
    this.dialogRef.close({
      gameId: this.selectedGameId,
      scores: { ...this.scores },
    });
  }
}

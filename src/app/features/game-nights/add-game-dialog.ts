import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { Game } from '../../core/models/game.model';

interface DialogData {
  games: Game[];
  playerIds: string[];
  playerMap: Map<string, string>;
}

@Component({
  selector: 'app-add-game-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>Spiel hinzufügen</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Spiel auswählen</mat-label>
        <mat-select [(ngModel)]="selectedGameId" (selectionChange)="onGameChange()">
          @for (game of data.games; track game.id) {
            <mat-option [value]="game.id">
              {{ game.name }}
              @if (game.isTeamGame) { (Team) }
            </mat-option>
          }
        </mat-select>
      </mat-form-field>

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

  selectedGameId = '';
  scores: Record<string, number> = {};

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

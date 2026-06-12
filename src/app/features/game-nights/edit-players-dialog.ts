import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Player } from '../../core/models/player.model';

interface DialogData {
  allPlayers: Player[];
  selectedPlayerIds: string[];
}

@Component({
  selector: 'app-edit-players-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatCheckboxModule],
  template: `
    <h2 mat-dialog-title>Teilnehmer bearbeiten</h2>
    <mat-dialog-content>
      @if (data.allPlayers.length === 0) {
        <p class="empty-hint">Keine Spieler vorhanden.</p>
      } @else {
        <div class="player-selection">
          @for (player of data.allPlayers; track player.id) {
            <div class="player-checkbox"
                 [class.selected]="selectedIds.has(player.id)"
                 (click)="togglePlayer(player.id)">
              <mat-checkbox
                [checked]="selectedIds.has(player.id)"
                (click)="$event.stopPropagation()"
                (change)="togglePlayer(player.id)">
              </mat-checkbox>
              <div class="player-avatar-sm">{{ player.name.charAt(0).toUpperCase() }}</div>
              <span>{{ player.name }}</span>
            </div>
          }
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Abbrechen</button>
      <button mat-flat-button color="primary"
              [disabled]="selectedIds.size < 2"
              (click)="save()">
        Speichern
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .player-selection {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 12px;
      margin-top: 8px;
      margin-bottom: 8px;
    }

    .player-checkbox {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      cursor: pointer;
      transition: all var(--transition-fast);
      user-select: none;

      &:hover {
        background: var(--color-bg-card-hover);
        border-color: rgba(255, 255, 255, 0.15);
      }

      &.selected {
        background: rgba(245, 158, 11, 0.08);
        border-color: rgba(245, 158, 11, 0.3);
      }
    }

    .player-avatar-sm {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--gradient-accent);
      color: #000;
      font-weight: 700;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .empty-hint {
      color: var(--color-text-muted);
      font-style: italic;
    }
  `,
})
export class EditPlayersDialogComponent implements OnInit {
  data = inject<DialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<EditPlayersDialogComponent>);

  selectedIds = new Set<string>();

  ngOnInit() {
    this.data.selectedPlayerIds.forEach((id) => this.selectedIds.add(id));
  }

  togglePlayer(playerId: string) {
    if (this.selectedIds.has(playerId)) {
      this.selectedIds.delete(playerId);
    } else {
      this.selectedIds.add(playerId);
    }
  }

  save() {
    this.dialogRef.close(Array.from(this.selectedIds));
  }
}

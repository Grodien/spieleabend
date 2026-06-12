import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PlayerService } from '../../core/services/player.service';
import { GameNightService } from '../../core/services/game-night.service';
import { Player } from '../../core/models/player.model';

@Component({
  selector: 'app-game-night-create',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatCheckboxModule, MatNativeDateModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Neuer Spieleabend</h1>
      </div>

      <div class="create-form animate-slide-in">
        <div class="form-section glass-card">
          <h3 class="section-title">Details</h3>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Datum</mat-label>
            <input matInput [matDatepicker]="picker" [(ngModel)]="date" />
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Kosten pro Spiel (CHF)</mat-label>
            <mat-select [(ngModel)]="costPerGame">
              <mat-option [value]="3">3.- CHF</mat-option>
              <mat-option [value]="5">5.- CHF</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="form-section glass-card">
          <h3 class="section-title">Spieler auswählen</h3>

          @if (players().length === 0) {
            <div class="empty-hint">
              Keine Spieler vorhanden. Erstelle zuerst Spieler unter "Spieler".
            </div>
          } @else {
            <div class="player-selection">
              @for (player of players(); track player.id) {
                <div class="player-checkbox"
                     [class.selected]="selectedPlayerIds.has(player.id)"
                     (click)="togglePlayer(player.id)">
                  <mat-checkbox
                    [checked]="selectedPlayerIds.has(player.id)"
                    (click)="$event.stopPropagation()"
                    (change)="togglePlayer(player.id)">
                  </mat-checkbox>
                  <div class="player-avatar-sm">{{ player.name.charAt(0).toUpperCase() }}</div>
                  <span>{{ player.name }}</span>
                </div>
              }
            </div>
          }

          <div class="selected-count">
            {{ selectedPlayerIds.size }} Spieler ausgewählt
          </div>
        </div>

        <div class="form-actions">
          <button mat-button (click)="cancel()">Abbrechen</button>
          <button mat-fab extended
                  [disabled]="!canSave()"
                  (click)="save()">
            <mat-icon>check</mat-icon>
            Spieleabend erstellen
          </button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .create-form {
      max-width: 600px;
    }

    .form-section {
      margin-bottom: 20px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 20px;
      color: var(--color-text-primary);
    }

    .full-width {
      width: 100%;
    }

    .player-selection {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .player-checkbox {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: background var(--transition-fast);

      &:hover {
        background: rgba(255, 255, 255, 0.04);
      }

      &.selected {
        background: rgba(245, 158, 11, 0.08);
      }

      span {
        font-weight: 500;
      }
    }

    .player-avatar-sm {
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
    }

    .selected-count {
      margin-top: 12px;
      font-size: 13px;
      color: var(--color-text-secondary);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 8px;
    }

    .empty-hint {
      font-size: 14px;
      color: var(--color-text-muted);
      padding: 16px 0;
    }
  `,
})
export class GameNightCreateComponent implements OnInit {
  private playerService = inject(PlayerService);
  private gameNightService = inject(GameNightService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  players = signal<Player[]>([]);
  date: Date = new Date();
  costPerGame: 3 | 5 = 3;
  selectedPlayerIds = new Set<string>();

  ngOnInit() {
    this.playerService.getAll().subscribe((players) => {
      this.players.set(players);
    });
  }

  togglePlayer(playerId: string) {
    if (this.selectedPlayerIds.has(playerId)) {
      this.selectedPlayerIds.delete(playerId);
    } else {
      this.selectedPlayerIds.add(playerId);
    }
  }

  canSave(): boolean {
    return this.selectedPlayerIds.size >= 2 && !!this.date;
  }

  save() {
    if (!this.canSave()) return;

    this.gameNightService
      .create(this.date, this.costPerGame, Array.from(this.selectedPlayerIds))
      .then((id) => {
        this.snackBar.open('Spieleabend erstellt!', 'OK', { duration: 2000 });
        this.router.navigate(['/game-nights', id]);
      });
  }

  cancel() {
    this.router.navigate(['/game-nights']);
  }
}

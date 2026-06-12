import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PlayerService } from '../../core/services/player.service';
import { Player } from '../../core/models/player.model';
import { PlayerDialogComponent } from './player-dialog';

@Component({
  selector: 'app-player-list',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule, MatSnackBarModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Spieler</h1>
        <button mat-fab extended (click)="openDialog()">
          <mat-icon>person_add</mat-icon>
          Spieler hinzufügen
        </button>
      </div>

      @if (players().length === 0) {
        <div class="empty-state animate-scale-in">
          <div class="empty-icon">👥</div>
          <div class="empty-title">Keine Spieler</div>
          <div class="empty-text">Füge deinen ersten Spieler hinzu, um loszulegen.</div>
        </div>
      } @else {
        <div class="card-grid">
          @for (player of players(); track player.id; let i = $index) {
            <div class="glass-card player-card" [style.animation-delay]="i * 50 + 'ms'" style="animation: slideInUp 0.4s ease-out backwards">
              <div class="player-info">
                <div class="player-avatar">{{ player.name.charAt(0).toUpperCase() }}</div>
                <div class="player-name">{{ player.name }}</div>
              </div>
              <button mat-icon-button (click)="deletePlayer(player)" class="delete-btn">
                <mat-icon>delete_outline</mat-icon>
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .player-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .player-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .player-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--gradient-accent);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 700;
      color: #000;
    }

    .player-name {
      font-size: 16px;
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
  `,
})
export class PlayerListComponent implements OnInit {
  private playerService = inject(PlayerService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  players = signal<Player[]>([]);

  ngOnInit() {
    this.playerService.getAll().subscribe((players) => {
      this.players.set(players);
    });
  }

  openDialog() {
    const dialogRef = this.dialog.open(PlayerDialogComponent, {
      width: '100%',
      maxWidth: '400px',
    });

    dialogRef.afterClosed().subscribe((name: string) => {
      if (name) {
        this.playerService.create(name).then(() => {
          this.snackBar.open('Spieler hinzugefügt!', 'OK', { duration: 2000 });
        });
      }
    });
  }

  deletePlayer(player: Player) {
    this.playerService.delete(player.id).then(() => {
      this.snackBar.open(`${player.name} gelöscht`, 'OK', { duration: 2000 });
    });
  }
}

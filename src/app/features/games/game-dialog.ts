import { Component } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-game-dialog',
  standalone: true,
  imports: [
    MatDialogModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatSlideToggleModule, FormsModule,
  ],
  template: `
    <h2 mat-dialog-title>Neues Spiel</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Name</mat-label>
        <input matInput [(ngModel)]="name" (keyup.enter)="save()" autofocus placeholder="z.B. Catan" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Scoring System</mat-label>
        <mat-select [(ngModel)]="scoringSystem">
          <mat-option value="highest">Highest Wins (höchster Score gewinnt)</mat-option>
          <mat-option value="lowest">Lowest Wins (tiefster Score gewinnt)</mat-option>
        </mat-select>
      </mat-form-field>

      <div class="toggle-row">
        <mat-slide-toggle [(ngModel)]="isTeamGame">Teamspiel</mat-slide-toggle>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Abbrechen</button>
      <button mat-flat-button color="primary" [disabled]="!name.trim()" (click)="save()">
        Speichern
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .full-width {
      width: 100%;
    }
    .toggle-row {
      margin: 8px 0 16px;
    }
  `,
})
export class GameDialogComponent {
  name = '';
  scoringSystem = 'highest';
  isTeamGame = false;

  constructor(private dialogRef: MatDialogRef<GameDialogComponent>) {}

  save() {
    if (this.name.trim()) {
      this.dialogRef.close({
        name: this.name.trim(),
        scoringSystem: this.scoringSystem,
        isTeamGame: this.isTeamGame,
      });
    }
  }
}

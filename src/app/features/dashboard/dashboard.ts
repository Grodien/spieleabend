import { Component, inject, OnInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { DashboardStatsService } from './services/dashboard-stats.service';
import { KpiCardsComponent } from './components/kpi-cards/kpi-cards';
import { NextGameNightCardComponent } from './components/next-game-night-card/next-game-night-card';
import { LastGameNightCardComponent } from './components/last-game-night-card/last-game-night-card';
import { PlayerStatsComponent } from './components/player-stats/player-stats';
import { GameStatsComponent } from './components/game-stats/game-stats';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  providers: [DashboardStatsService],
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    KpiCardsComponent,
    NextGameNightCardComponent,
    LastGameNightCardComponent,
    PlayerStatsComponent,
    GameStatsComponent,
  ],
  template: `
    <div class="page-container">
      <div class="page-header dashboard-header">
        <h1>Dashboard</h1>

        <mat-form-field appearance="outline" class="year-filter-field">
          <mat-label>Jahr filtern</mat-label>
          <mat-select [value]="stats.selectedYear()" (selectionChange)="stats.selectedYear.set($event.value)">
            <mat-option value="all">Alle Jahre</mat-option>
            @for (year of stats.availableYears(); track year) {
              <mat-option [value]="year">{{ year }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <app-kpi-cards />
      <app-next-game-night-card />
      <app-last-game-night-card />

      @if (stats.playerStats().length > 0) {
        <app-player-stats />
        <app-game-stats />
      } @else {
        <div class="empty-state animate-scale-in" style="margin-top: 32px;">
          <div class="empty-icon">📊</div>
          <div class="empty-title">Keine Daten</div>
          <div class="empty-text">Erstelle Spieleabende und spiele ein paar Spiele, um Statistiken zu sehen.</div>
        </div>
      }
    </div>
  `,
  styles: `
    .dashboard-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 24px;

      h1 { margin-bottom: 0; }
    }

    .year-filter-field {
      width: 160px;
      margin-bottom: -16px;
    }

    @media (max-width: 768px) {
      .dashboard-header {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;

        .year-filter-field {
          width: 100%;
          margin-bottom: 0;
        }
      }
    }
  `,
})
export class DashboardComponent implements OnInit {
  stats = inject(DashboardStatsService);

  ngOnInit() {
    this.stats.initialize();
  }
}

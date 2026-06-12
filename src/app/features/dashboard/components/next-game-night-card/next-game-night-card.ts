import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DashboardStatsService } from '../../services/dashboard-stats.service';
import { CalendarService } from '../../services/calendar.service';

@Component({
  selector: 'app-next-game-night-card',
  standalone: true,
  imports: [DatePipe, RouterLink, MatIconModule],
  template: `
    @if (stats.nextGameNight()) {
      <div
        class="glass-card next-night-card"
        [routerLink]="['/game-nights', stats.nextGameNight()!.id]"
        style="animation: slideInUp 0.5s ease-out 0.02s backwards; cursor: pointer;"
      >
        <div class="next-night-content">
          <div class="next-night-info">
            <span class="next-night-label">📅 Nächster Spieleabend</span>
            <span class="next-night-date">
              {{ stats.nextGameNight()!.date | date:'dd.MM.yyyy' }}
              ({{ stats.getDaysUntil(stats.nextGameNight()!.date) }})
            </span>
          </div>

          <div class="next-night-actions">
            <a
              [href]="calendar.getGoogleCalendarUrl(stats.nextGameNight()!)"
              target="_blank"
              (click)="$event.stopPropagation()"
              class="calendar-action-btn google-btn"
            >
              <mat-icon class="btn-icon">calendar_today</mat-icon>
              Google
            </a>
            <a
              [href]="calendar.getOutlookCalendarUrl(stats.nextGameNight()!)"
              target="_blank"
              (click)="$event.stopPropagation()"
              class="calendar-action-btn outlook-btn"
            >
              <mat-icon class="btn-icon">mail</mat-icon>
              Outlook
            </a>
            <button
              class="calendar-action-btn ics-btn"
              (click)="calendar.downloadIcs(stats.nextGameNight()!); $event.stopPropagation()"
            >
              <mat-icon class="btn-icon">download</mat-icon>
              ICS
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .next-night-card {
      background: linear-gradient(145deg, rgba(30, 30, 42, 0.95), rgba(26, 26, 36, 0.85));
      border-color: rgba(96, 165, 250, 0.2);
      margin-bottom: 24px;
      padding: 20px 24px;
      transition: all var(--transition-normal);

      &:hover {
        border-color: rgba(96, 165, 250, 0.5);
        box-shadow: var(--shadow-md), 0 0 20px rgba(96, 165, 250, 0.15);
        transform: translateY(-2px);
      }
    }

    .next-night-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }

    .next-night-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .next-night-label {
      font-size: 13px;
      color: var(--color-text-secondary);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .next-night-date {
      font-size: 20px;
      font-weight: 700;
      color: var(--color-text-primary);
    }

    .next-night-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .calendar-action-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: var(--radius-md);
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      border: 1px solid var(--color-border);
      background: rgba(255, 255, 255, 0.03);
      color: var(--color-text-primary);
      cursor: pointer;
      transition: all var(--transition-fast);

      .btn-icon {
        font-size: 16px !important;
        width: 16px !important;
        height: 16px !important;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.15);
        transform: translateY(-1px);
      }

      &.google-btn:hover {
        border-color: rgba(219, 68, 85, 0.4);
        background: rgba(219, 68, 85, 0.08);
        color: #f87171;
      }

      &.outlook-btn:hover {
        border-color: rgba(0, 120, 212, 0.4);
        background: rgba(0, 120, 212, 0.08);
        color: #60a5fa;
      }

      &.ics-btn:hover {
        border-color: rgba(139, 92, 246, 0.4);
        background: rgba(139, 92, 246, 0.08);
        color: #c084fc;
      }
    }
  `,
})
export class NextGameNightCardComponent {
  stats = inject(DashboardStatsService);
  calendar = inject(CalendarService);
}

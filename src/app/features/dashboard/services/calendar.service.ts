import { Injectable } from '@angular/core';
import { GameNight } from '../../../core/models/game-night.model';

@Injectable({ providedIn: 'root' })
export class CalendarService {
  private parseDate(dateStr: string): { year: number; month: number; day: number } | null {
    const yyyymmddMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})(T.*)?$/);
    if (yyyymmddMatch) {
      return {
        year: parseInt(yyyymmddMatch[1], 10),
        month: parseInt(yyyymmddMatch[2], 10) - 1,
        day: parseInt(yyyymmddMatch[3], 10),
      };
    }

    const parsed = Date.parse(dateStr);
    if (!isNaN(parsed)) {
      const dateObj = new Date(parsed);
      return {
        year: dateObj.getFullYear(),
        month: dateObj.getMonth(),
        day: dateObj.getDate(),
      };
    }

    const num = Number(dateStr);
    if (!isNaN(num)) {
      const dateObj = new Date(num);
      if (!isNaN(dateObj.getTime())) {
        return {
          year: dateObj.getFullYear(),
          month: dateObj.getMonth(),
          day: dateObj.getDate(),
        };
      }
    }

    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    return {
      year: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10) - 1,
      day: parseInt(parts[2], 10),
    };
  }

  private toUtcString(date: Date, withColons = false): string {
    if (withColons) {
      return date.toISOString().split('.')[0] + 'Z';
    }
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  downloadIcs(night: GameNight | null | undefined): void {
    if (!night?.date) return;
    try {
      const parsed = this.parseDate(night.date);
      if (!parsed) return;
      const { year, month, day } = parsed;

      const localStart = new Date(year, month, day, 13, 0, 0);
      const localEnd = new Date(year, month, day, 23, 0, 0);
      const startUtcStr = this.toUtcString(localStart);
      const endUtcStr = this.toUtcString(localEnd);

      const now = new Date();
      const stamp =
        now.getUTCFullYear().toString() +
        String(now.getUTCMonth() + 1).padStart(2, '0') +
        String(now.getUTCDate()).padStart(2, '0') +
        'T' +
        String(now.getUTCHours()).padStart(2, '0') +
        String(now.getUTCMinutes()).padStart(2, '0') +
        String(now.getUTCSeconds()).padStart(2, '0') +
        'Z';

      const icsLines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Spieleabend Tracker//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:spieleabend-${night.id}`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${startUtcStr}`,
        `DTEND:${endUtcStr}`,
        'SUMMARY:Spieleabend',
        'DESCRIPTION:Gemeinsamer Spieleabend',
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR',
      ];

      const icsContent = icsLines.join('\r\n') + '\r\n';
      const blob = new Blob([icsContent], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `spieleabend-${night.date}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      console.error('Error downloading ICS file:', e);
    }
  }

  getGoogleCalendarUrl(night: GameNight | null | undefined): string {
    if (!night?.date) return '';
    try {
      const parsed = this.parseDate(night.date);
      if (!parsed) return '';
      const { year, month, day } = parsed;

      const localStart = new Date(year, month, day, 13, 0, 0);
      const localEnd = new Date(year, month, day, 23, 0, 0);
      const startUtcStr = this.toUtcString(localStart);
      const endUtcStr = this.toUtcString(localEnd);

      const title = encodeURIComponent('Spieleabend 🎲');
      const details = encodeURIComponent(
        'Gemeinsamer Spieleabend. Vergiss nicht deine Scores einzutragen!'
      );
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startUtcStr}/${endUtcStr}&details=${details}`;
    } catch (e) {
      console.error('Error generating Google Calendar URL:', e);
      return '';
    }
  }

  getOutlookCalendarUrl(night: GameNight | null | undefined): string {
    if (!night?.date) return '';
    try {
      const parsed = this.parseDate(night.date);
      if (!parsed) return '';
      const { year, month, day } = parsed;

      const localStart = new Date(year, month, day, 13, 0, 0);
      const localEnd = new Date(year, month, day, 23, 0, 0);
      const startUtcStr = this.toUtcString(localStart, true);
      const endUtcStr = this.toUtcString(localEnd, true);

      const title = encodeURIComponent('Spieleabend 🎲');
      const details = encodeURIComponent(
        'Gemeinsamer Spieleabend. Vergiss nicht deine Scores einzutragen!'
      );
      return `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${title}&startdt=${startUtcStr}&enddt=${endUtcStr}&allday=false&body=${details}`;
    } catch (e) {
      console.error('Error generating Outlook Calendar URL:', e);
      return '';
    }
  }
}

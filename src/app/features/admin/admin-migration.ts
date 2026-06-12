import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GameNightService } from '../../core/services/game-night.service';
import { GameNightCacheService } from '../../core/services/game-night-cache.service';
import { PlayedGame } from '../../core/models/game-night.model';

interface MigrationResult {
  nightId: string;
  date: string;
  status: 'skipped' | 'migrated' | 'error';
  count: number;
  error?: string;
}

@Component({
  selector: 'app-admin-migration',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>🔧 Admin – Datenmigration</h1>
      </div>

      <div class="glass-card migration-card animate-slide-in">
        <h3 class="section-title">Firestore Schema Migration</h3>
        <p class="description">
          Migriert alle Spieleabende vom alten Schema <code>gameNights/&#123;id&#125;/playedGames/…</code>
          zum neuen eingebetteten Schema <code>gameNights/&#123;id&#125;.playedGames[]</code>.
        </p>
        <p class="description">
          Spieleabende die bereits migriert wurden (d.h. <code>playedGames</code> Array ist nicht leer),
          werden übersprungen. Die alte Subcollection bleibt erhalten (kein Datenverlust).
        </p>

        <div class="migration-info">
          <div class="info-item">
            <mat-icon>info_outline</mat-icon>
            <span>Diese Aktion ist idempotent – mehrfaches Ausführen ist sicher.</span>
          </div>
          <div class="info-item">
            <mat-icon>storage</mat-icon>
            <span>Lese-Kosten: 1 Read pro PlayedGame in der alten Subcollection (einmalig).</span>
          </div>
        </div>

        <div class="action-row">
          <button
            mat-flat-button
            class="migrate-btn"
            [disabled]="running()"
            (click)="runMigration()"
          >
            <mat-icon>{{ running() ? 'hourglass_empty' : 'sync' }}</mat-icon>
            {{ running() ? 'Migration läuft…' : 'Migration starten' }}
          </button>

          @if (done()) {
            <div class="success-badge">
              <mat-icon>check_circle</mat-icon>
              Migration abgeschlossen!
            </div>
          }
        </div>
      </div>

      <!-- Progress -->
      @if (running() || results().length > 0) {
        <div class="glass-card results-card" style="animation: slideInUp 0.4s ease-out">
          <h3 class="section-title">
            Fortschritt
            @if (running()) {
              <span class="progress-label">{{ results().length }} / {{ total() }} verarbeitet</span>
            }
          </h3>

          <div class="progress-bar-track">
            <div
              class="progress-bar-fill"
              [style.width]="total() > 0 ? (results().length / total() * 100) + '%' : '0%'"
            ></div>
          </div>

          <div class="results-list">
            @for (r of results(); track r.nightId) {
              <div class="result-row" [class]="'result-' + r.status">
                <mat-icon class="result-icon">
                  {{ r.status === 'migrated' ? 'check' : r.status === 'skipped' ? 'skip_next' : 'error_outline' }}
                </mat-icon>
                <span class="result-date">{{ r.date }}</span>
                <span class="result-detail">
                  @if (r.status === 'migrated') {
                    {{ r.count }} Spiel{{ r.count !== 1 ? 'e' : '' }} migriert
                  } @else if (r.status === 'skipped') {
                    Bereits migriert ({{ r.count }} Spiele im Array)
                  } @else {
                    Fehler: {{ r.error }}
                  }
                </span>
              </div>
            }
          </div>

          <!-- Summary -->
          @if (done()) {
            <div class="summary-grid">
              <div class="summary-item migrated">
                <div class="summary-value">{{ countByStatus('migrated') }}</div>
                <div class="summary-label">Migriert</div>
              </div>
              <div class="summary-item skipped">
                <div class="summary-value">{{ countByStatus('skipped') }}</div>
                <div class="summary-label">Übersprungen</div>
              </div>
              <div class="summary-item error">
                <div class="summary-value">{{ countByStatus('error') }}</div>
                <div class="summary-label">Fehler</div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .migration-card {
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .description {
      font-size: 14px;
      color: var(--color-text-secondary);
      line-height: 1.6;
      margin-bottom: 12px;

      code {
        background: var(--color-bg-surface);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 12px;
        color: var(--color-accent-light);
      }
    }

    .migration-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: var(--color-bg-surface);
      border-radius: var(--radius-md);
      padding: 12px 16px;
      margin-bottom: 24px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: var(--color-text-secondary);

      mat-icon {
        font-size: 18px !important;
        width: 18px !important;
        height: 18px !important;
        color: var(--color-accent);
      }
    }

    .action-row {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .migrate-btn {
      background: var(--gradient-accent) !important;
      color: #000 !important;
      font-weight: 700 !important;
      height: 48px;
      padding: 0 24px !important;

      mat-icon {
        margin-right: 8px;
      }

      &[disabled] {
        opacity: 0.6;
      }
    }

    .success-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--color-success);
      font-weight: 600;
      font-size: 14px;

      mat-icon {
        font-size: 20px !important;
        width: 20px !important;
        height: 20px !important;
      }
    }

    .results-card {
      margin-bottom: 24px;
    }

    .progress-label {
      font-size: 13px;
      font-weight: 400;
      color: var(--color-text-secondary);
    }

    .progress-bar-track {
      height: 6px;
      background: var(--color-bg-surface);
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 20px;
    }

    .progress-bar-fill {
      height: 100%;
      background: var(--gradient-accent);
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .results-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 400px;
      overflow-y: auto;
      margin-bottom: 20px;
    }

    .result-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      font-size: 13px;

      &.result-migrated {
        background: rgba(16, 185, 129, 0.06);
        .result-icon { color: var(--color-success); }
      }

      &.result-skipped {
        background: rgba(255, 255, 255, 0.03);
        .result-icon { color: var(--color-text-muted); }
      }

      &.result-error {
        background: rgba(239, 68, 68, 0.06);
        .result-icon { color: var(--color-danger); }
      }
    }

    .result-icon {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
      flex-shrink: 0;
    }

    .result-date {
      font-weight: 600;
      width: 100px;
      flex-shrink: 0;
    }

    .result-detail {
      color: var(--color-text-secondary);
      flex: 1;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .summary-item {
      text-align: center;
      padding: 16px;
      background: var(--color-bg-surface);
      border-radius: var(--radius-md);

      .summary-value {
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 4px;
      }

      .summary-label {
        font-size: 12px;
        color: var(--color-text-secondary);
        font-weight: 500;
      }

      &.migrated .summary-value { color: var(--color-success); }
      &.skipped .summary-value { color: var(--color-text-muted); }
      &.error .summary-value { color: var(--color-danger); }
    }
  `,
})
export class AdminMigrationComponent {
  private gameNightService = inject(GameNightService);
  private cache = inject(GameNightCacheService);

  running = signal(false);
  done = signal(false);
  total = signal(0);
  results = signal<MigrationResult[]>([]);

  countByStatus(status: MigrationResult['status']): number {
    return this.results().filter((r) => r.status === status).length;
  }

  async runMigration(): Promise<void> {
    this.running.set(true);
    this.done.set(false);
    this.results.set([]);

    try {
      const nights = await this.gameNightService.getAllOnce();
      this.total.set(nights.length);

      for (const night of nights) {
        try {
          // If already has embedded playedGames (non-empty), skip
          if (night.playedGames && night.playedGames.length > 0) {
            this.results.update((r) => [
              ...r,
              {
                nightId: night.id,
                date: night.date,
                status: 'skipped',
                count: night.playedGames.length,
              },
            ]);
            continue;
          }

          // Read from legacy subcollection
          const legacy: PlayedGame[] = await this.gameNightService.getLegacyPlayedGames(night.id);

          // Write embedded array (even if empty – marks as migrated)
          await this.gameNightService.update(night.id, { playedGames: legacy });

          this.results.update((r) => [
            ...r,
            {
              nightId: night.id,
              date: night.date,
              status: 'migrated',
              count: legacy.length,
            },
          ]);
        } catch (e) {
          this.results.update((r) => [
            ...r,
            {
              nightId: night.id,
              date: night.date,
              status: 'error',
              count: 0,
              error: e instanceof Error ? e.message : String(e),
            },
          ]);
        }
      }

      // Reset cache so fresh data is loaded everywhere
      this.cache.reset();
      this.cache.initialize();
    } finally {
      this.running.set(false);
      this.done.set(true);
    }
  }
}

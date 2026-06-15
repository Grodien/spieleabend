import { Component, inject, signal, computed, effect, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GameNightCacheService } from '../../core/services/game-night-cache.service';
import { GameNightService } from '../../core/services/game-night.service';
import { GameService } from '../../core/services/game.service';
import { CostCalculatorService } from '../../core/services/cost-calculator.service';
import { Game } from '../../core/models/game.model';
import { PlayedGame } from '../../core/models/game-night.model';

@Component({
  selector: 'app-scoreboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatCheckboxModule,
    MatSnackBarModule,
    DatePipe,
  ],
  template: `
    <div class="page-container">
      <!-- Sidenav header spacer -->
      <div class="page-header">
        <h1>Scoreboard</h1>
      </div>

      <!-- No Game Night Info -->
      @if (!latestGameNight()) {
        <div class="empty-state animate-scale-in">
          <div class="empty-icon">📅</div>
          <div class="empty-title">Kein Spieleabend vorhanden</div>
          <div class="empty-text">Erstelle zuerst einen Spieleabend, um das Scoreboard nutzen zu können.</div>
          <button mat-flat-button color="primary" routerLink="/game-nights/new" style="margin-top: 16px;">
            Spieleabend erstellen
          </button>
        </div>
      }
      <!-- Setup Sektion -->
      @else if (!activeGame()) {
        <div class="setup-container glass-card animate-scale-in">
          <h2 class="setup-title">Neues Spiel erfassen</h2>
          <div class="setup-subtitle">
            <mat-icon class="subtitle-icon">calendar_today</mat-icon>
            Aktueller Spieleabend: {{ latestGameNight()!.date | date:'dd.MM.yyyy' }}
          </div>

          <div class="setup-form">
            <!-- Game Autocomplete -->
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

            <!-- Player Selection -->
            <div class="players-selection">
              <h4 class="selection-subtitle">Mitspieler auswählen</h4>
              <div class="players-checkbox-grid">
                @for (player of gameNightPlayers(); track player.id) {
                  <mat-checkbox [(ngModel)]="isPlayerSelected[player.id]">
                    {{ player.name }}
                  </mat-checkbox>
                }
              </div>
            </div>

            <!-- Start button -->
            <button mat-flat-button
                    color="primary"
                    class="start-btn"
                    [disabled]="!canStartGame()"
                    (click)="startGame()">
              <mat-icon>play_arrow</mat-icon>
              Spiel starten
            </button>
          </div>
        </div>
      }
      <!-- Active Game (Scoreboard) -->
      @else {
        <div class="game-container animate-scale-in">
          <div class="glass-card game-header-card">
            <div class="game-title-row">
              <div class="game-title-info">
                <h2>{{ getGameName() }}</h2>
                <div class="game-meta-info">
                  <span class="chip-badge" [class.chip-highest]="getScoringSystem() === 'highest'" [class.chip-lowest]="getScoringSystem() === 'lowest'">
                    <mat-icon class="chip-icon">{{ getScoringSystem() === 'highest' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                    {{ getScoringSystem() === 'highest' ? 'Highest Wins' : 'Lowest Wins' }}
                  </span>
                  @if (isTeamGame()) {
                    <span class="chip-badge chip-team">
                      <mat-icon class="chip-icon">groups</mat-icon>
                      Teamspiel
                    </span>
                  }
                </div>
              </div>
              <button mat-stroked-button color="warn" (click)="cancelGame()">
                <mat-icon>close</mat-icon>
                Abbrechen
              </button>
            </div>
          </div>

          <!-- Score Table (Desktop only) -->
          <div class="table-container desktop-only">
            <table class="scoreboard-table">
              <thead>
                <tr>
                  <th class="round-col-header">Runde</th>
                  @for (pid of participatingPlayerIds(); track pid) {
                    <th>{{ getPlayerName(pid) }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (round of rounds(); track $index; let r = $index) {
                  <tr>
                    <td class="round-cell">Runde {{ r + 1 }}</td>
                    @for (pid of participatingPlayerIds(); track pid) {
                      <td class="round-input-cell">
                        <input type="number"
                               class="round-input"
                               [(ngModel)]="round[pid]"
                               (ngModelChange)="onScoreChange()"
                               placeholder="0" />
                      </td>
                    }
                  </tr>
                }
                <tr class="total-row">
                  <td class="total-cell">Total</td>
                  @for (pid of participatingPlayerIds(); track pid) {
                    <td class="total-score-cell" [class.leader-cell]="currentLeaderIds().has(pid)">
                      @if (currentLeaderIds().has(pid)) {
                        <span class="leader-crown">👑</span>
                      }
                      {{ playerTotals()[pid] }}
                    </td>
                  }
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile Cards Layout (Mobile only) -->
          <div class="mobile-rounds-container mobile-only">
            @for (round of rounds(); track $index; let r = $index) {
              <div class="glass-card mobile-round-card">
                <div class="mobile-round-header">
                  <h3>Runde {{ r + 1 }}</h3>
                </div>
                <div class="mobile-round-players">
                  @for (pid of participatingPlayerIds(); track pid) {
                    <div class="mobile-player-row">
                      <span class="mobile-player-name" [class.mobile-leader-text]="currentLeaderIds().has(pid)">
                        @if (currentLeaderIds().has(pid)) {
                          <span class="leader-crown">👑</span>
                        }
                        {{ getPlayerName(pid) }}
                      </span>
                      <input type="number"
                             class="mobile-round-input"
                             [(ngModel)]="round[pid]"
                             (ngModelChange)="onScoreChange()"
                             placeholder="0"
                             inputmode="numeric" />
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Sticky Mobile Totals Bar (Mobile only) -->
          <div class="mobile-totals-sticky mobile-only">
            <div class="mobile-totals-scroll">
              @for (pid of participatingPlayerIds(); track pid) {
                <div class="mobile-total-chip" [class.mobile-leader-chip]="currentLeaderIds().has(pid)">
                  <span class="chip-player-name">
                    @if (currentLeaderIds().has(pid)) {
                      👑
                    }
                    {{ getPlayerName(pid) }}
                  </span>
                  <span class="chip-player-score">{{ playerTotals()[pid] }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Bottom Action Buttons -->
          <div class="actions-row">
            <div class="actions-left">
              <button mat-flat-button color="accent" (click)="addRound()">
                <mat-icon>add</mat-icon>
                Runde hinzufügen
              </button>
              <button mat-stroked-button
                      [disabled]="rounds().length <= 1"
                      (click)="deleteLastRound()">
                <mat-icon>remove</mat-icon>
                Letzte Runde löschen
              </button>
            </div>
            <div class="actions-right">
              <button mat-flat-button
                      color="primary"
                      (click)="saveGame()">
                <mat-icon>save</mat-icon>
                Spiel abschließen
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .full-width {
      width: 100%;
    }

    .desktop-only {
      display: block;
    }

    .mobile-only {
      display: none;
    }

    .setup-container {
      max-width: 600px;
      margin: 0 auto;
    }

    .setup-title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .setup-subtitle {
      font-size: 14px;
      color: var(--color-text-secondary);
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 24px;
    }

    .subtitle-icon {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
    }

    .setup-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .players-selection {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 16px;
      background: rgba(255, 255, 255, 0.01);
    }

    .selection-subtitle {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 16px;
      color: var(--color-text-secondary);
    }

    .players-checkbox-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 12px;
    }

    .start-btn {
      height: 48px;
      font-weight: 600;
      border-radius: var(--radius-md) !important;
    }

    /* Active Game Sektion */
    .game-container {
      width: 100%;
    }

    .game-header-card {
      margin-bottom: 24px;
    }

    .game-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .game-title-info h2 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .game-meta-info {
      display: flex;
      gap: 12px;
    }

    .table-container {
      overflow-x: auto;
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
      background: var(--gradient-card);
      margin-bottom: 24px;
    }

    .scoreboard-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    .scoreboard-table th, .scoreboard-table td {
      border: 1px solid var(--color-border);
      padding: 10px 12px;
      text-align: center;
    }

    .scoreboard-table th {
      background: var(--color-bg-surface);
      font-weight: 600;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 0.05em;
    }

    .round-col-header {
      width: 100px;
    }

    .round-cell {
      font-weight: 500;
      color: var(--color-text-secondary);
      background: rgba(255, 255, 255, 0.01);
    }

    .round-input-cell {
      padding: 6px !important;
    }

    .round-input {
      width: 100%;
      max-width: 80px;
      border: 1px solid var(--color-border);
      background: var(--color-bg-primary);
      color: var(--color-text-primary);
      padding: 8px;
      border-radius: var(--radius-sm);
      text-align: center;
      font-weight: 600;
      font-size: 14px;

      &:focus {
        outline: none;
        border-color: var(--color-accent);
        box-shadow: 0 0 8px rgba(245, 158, 11, 0.2);
      }
    }

    .total-row {
      background: rgba(255, 255, 255, 0.03);
    }

    .total-cell {
      font-weight: 700;
      color: var(--color-text-primary);
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 0.05em;
    }

    .total-score-cell {
      font-weight: 700;
      font-size: 16px;
      position: relative;
    }

    .leader-cell {
      color: var(--color-accent-light) !important;
      background: rgba(251, 191, 36, 0.05);
    }

    .leader-crown {
      margin-right: 4px;
    }

    .actions-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      margin-top: 24px;
    }

    .actions-left, .actions-right {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    @media (max-width: 768px) {
      .desktop-only {
        display: none;
      }
      .mobile-only {
        display: block;
      }
      
      .game-container {
        padding-bottom: 110px; /* Space for the sticky bottom bar */
      }

      /* Mobile Round Cards */
      .mobile-rounds-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-bottom: 24px;
      }

      .mobile-round-card {
        padding: 16px;
        border: 1px solid var(--color-border);
      }

      .mobile-round-header {
        margin-bottom: 16px;
        border-bottom: 1px solid var(--color-border);
        padding-bottom: 8px;
      }

      .mobile-round-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        color: var(--color-text-primary);
      }

      .mobile-round-players {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .mobile-player-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
      }

      .mobile-player-name {
        font-weight: 500;
        color: var(--color-text-secondary);
        font-size: 15px;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .mobile-leader-text {
        color: var(--color-accent-light);
        font-weight: 600;
      }

      .mobile-round-input {
        width: 90px;
        height: 44px; /* Touch target optimized */
        border: 1px solid var(--color-border);
        background: var(--color-bg-primary);
        color: var(--color-text-primary);
        padding: 8px;
        border-radius: var(--radius-md);
        text-align: center;
        font-weight: 600;
        font-size: 16px !important; /* Prevents auto-zoom on iOS */

        &:focus {
          outline: none;
          border-color: var(--color-accent);
          box-shadow: 0 0 8px rgba(245, 158, 11, 0.2);
        }
      }

      /* Sticky Totals Bar */
      .mobile-totals-sticky {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(15, 23, 42, 0.85); /* Sleek dark semitransparent background */
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-top: 1px solid var(--color-border);
        padding: 12px 16px;
        z-index: 1000;
        display: flex !important; /* Force flex display when visible */
        justify-content: center;
      }

      .mobile-totals-scroll {
        display: flex;
        gap: 12px;
        overflow-x: auto;
        width: 100%;
        max-width: 600px;
        padding-bottom: 4px; /* For scrollbar breathing room */
        scrollbar-width: none; /* Hide default scrollbar */
        &::-webkit-scrollbar {
          display: none;
        }
      }

      .mobile-total-chip {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--color-border);
        padding: 8px 14px;
        border-radius: var(--radius-full);
        flex-shrink: 0;
      }

      .mobile-leader-chip {
        background: rgba(251, 191, 36, 0.1);
        border-color: var(--color-accent-light);
      }

      .chip-player-name {
        font-size: 13px;
        font-weight: 500;
        color: var(--color-text-secondary);
        white-space: nowrap;
      }

      .mobile-leader-chip .chip-player-name {
        color: var(--color-text-primary);
        font-weight: 600;
      }

      .chip-player-score {
        font-size: 14px;
        font-weight: 700;
        color: var(--color-text-primary);
      }

      .mobile-leader-chip .chip-player-score {
        color: var(--color-accent-light);
      }

      .actions-row {
        flex-direction: column;
        align-items: stretch;
      }
      .actions-left {
        flex-direction: column;
        align-items: stretch;
      }
      .actions-right button {
        width: 100%;
      }
    }
  `,
})
export class ScoreboardComponent implements OnInit {
  private cache = inject(GameNightCacheService);
  private gameNightService = inject(GameNightService);
  private gameService = inject(GameService);
  private costCalculator = inject(CostCalculatorService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  // Signals for state
  latestGameNight = computed(() => this.cache.gameNights()[0] || null);
  activeGame = signal<boolean>(false);
  games = signal<Game[]>([]);
  searchQuery = signal<string>('');
  participatingPlayerIds = signal<string[]>([]);
  rounds = signal<Record<string, number>[]>([]);

  // Setup inputs
  selectedGame: string | Game = '';
  selectedGameId = '';
  isPlayerSelected: Record<string, boolean> = {};

  constructor() {
    effect(() => {
      const latest = this.latestGameNight();
      if (latest) {
        latest.playerIds.forEach((pid) => {
          if (this.isPlayerSelected[pid] === undefined) {
            this.isPlayerSelected[pid] = true;
          }
        });
      }
    });
  }

  ngOnInit() {
    this.cache.initialize();

    this.gameService.getAll().subscribe((games) => {
      this.games.set(games);
    });
  }

  // Get active players of the evening
  gameNightPlayers = computed(() => {
    const gn = this.latestGameNight();
    if (!gn) return [];
    return gn.playerIds.map((pid) => {
      const p = this.cache.players().find((x) => x.id === pid);
      return {
        id: pid,
        name: p ? p.name : '?',
      };
    });
  });

  // Autocomplete games filter
  filteredGames = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.games();
    return this.games().filter((game) =>
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
    }
  }

  displayGameName(game: Game | null): string {
    return game ? game.name : '';
  }

  canStartGame(): boolean {
    if (!this.selectedGameId) return false;
    const activeCount = this.latestGameNight()?.playerIds.filter((id) => this.isPlayerSelected[id]).length ?? 0;
    return activeCount > 0;
  }

  startGame() {
    const game = this.selectedGame;
    if (!game || typeof game === 'string') return;

    const selectedPids = this.latestGameNight()?.playerIds.filter((id) => this.isPlayerSelected[id]) ?? [];
    if (selectedPids.length === 0) return;

    this.participatingPlayerIds.set(selectedPids);
    this.rounds.set([{}]); // Start with one empty round
    this.activeGame.set(true);
  }

  // Active game helpers
  getGameName(): string {
    const game = this.selectedGame;
    return game && typeof game !== 'string' ? game.name : '';
  }

  getScoringSystem(): 'highest' | 'lowest' {
    const game = this.selectedGame;
    return game && typeof game !== 'string' ? game.scoringSystem : 'highest';
  }

  isTeamGame(): boolean {
    const game = this.selectedGame;
    return game && typeof game !== 'string' ? game.isTeamGame : false;
  }

  getPlayerName(playerId: string): string {
    const p = this.cache.players().find((x) => x.id === playerId);
    return p ? p.name : '?';
  }

  // Live round calculations
  playerTotals = computed(() => {
    const totals: Record<string, number> = {};
    const pids = this.participatingPlayerIds();
    pids.forEach((pid) => (totals[pid] = 0));

    this.rounds().forEach((round) => {
      pids.forEach((pid) => {
        const val = Number(round[pid]) || 0;
        totals[pid] += val;
      });
    });

    return totals;
  });

  currentLeaderIds = computed(() => {
    const game = this.selectedGame;
    if (!game || typeof game === 'string') return new Set<string>();

    const totals = this.playerTotals();
    const pids = this.participatingPlayerIds();
    if (pids.length === 0) return new Set<string>();

    let bestScore = totals[pids[0]] || 0;
    for (const pid of pids) {
      const score = totals[pid] || 0;
      if (game.scoringSystem === 'highest') {
        if (score > bestScore) bestScore = score;
      } else {
        if (score < bestScore) bestScore = score;
      }
    }

    const leaders = new Set<string>();
    pids.forEach((pid) => {
      if ((totals[pid] || 0) === bestScore) {
        leaders.add(pid);
      }
    });

    return leaders;
  });

  // Table actions
  addRound() {
    const current = this.rounds();
    this.rounds.set([...current, {}]);
  }

  deleteLastRound() {
    const current = this.rounds();
    if (current.length > 1) {
      this.rounds.set(current.slice(0, -1));
    }
  }

  onScoreChange() {
    this.rounds.set([...this.rounds()]);
  }

  cancelGame() {
    if (confirm('Möchtest du das aktuelle Spiel wirklich abbrechen? Die eingegebenen Runden gehen verloren.')) {
      this.resetState();
    }
  }

  private resetState() {
    this.activeGame.set(false);
    this.rounds.set([]);
    this.selectedGame = '';
    this.selectedGameId = '';
    this.searchQuery.set('');
  }

  async saveGame() {
    const gn = this.latestGameNight();
    const game = this.selectedGame;
    if (!gn || !game || typeof game === 'string') return;

    const totals = this.playerTotals();

    // Calculate rank and costs using CostCalculatorService
    const costs = this.costCalculator.calculateCosts(
      totals,
      game.scoringSystem,
      game.isTeamGame,
      gn.costPerGame,
    );

    try {
      await this.gameNightService.addPlayedGame(gn.id, {
        gameId: game.id,
        gameName: game.name,
        isTeamGame: game.isTeamGame,
        scoringSystem: game.scoringSystem,
        scores: totals,
        costs: costs,
      });

      this.snackBar.open(`${game.name} wurde erfolgreich erfasst!`, 'OK', { duration: 3000 });
      this.resetState();
      
      // Redirect to the latest game night detail view
      this.router.navigate(['/game-nights', gn.id]);
    } catch (error) {
      console.error('Error saving game:', error);
      this.snackBar.open('Fehler beim Speichern des Spiels.', 'OK', { duration: 3000 });
    }
  }
}

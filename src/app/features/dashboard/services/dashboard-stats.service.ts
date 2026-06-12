import {
  Injectable,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { PlayerService } from '../../../core/services/player.service';
import { GameNightService } from '../../../core/services/game-night.service';
import { Player } from '../../../core/models/player.model';
import { GameNight, PlayedGame } from '../../../core/models/game-night.model';

export interface PlayerStats {
  playerId: string;
  name: string;
  totalCost: number;
  avgCostPerNight: number;
  nightsPlayed: number;
  gamesPlayed: number;
  wins: number;
}

/**
 * Provides all reactive data and computed statistics for the Dashboard.
 * Must be provided at the Dashboard component level (not root) so its
 * subscriptions are cleaned up when the dashboard is destroyed.
 */
@Injectable()
export class DashboardStatsService {
  private playerService = inject(PlayerService);
  private gameNightService = inject(GameNightService);
  private destroyRef = inject(DestroyRef);

  // ── Raw data signals ─────────────────────────────────────────────────────
  players = signal<Player[]>([]);
  gameNights = signal<GameNight[]>([]);
  allPlayedGames = signal<Map<string, PlayedGame[]>>(new Map());

  // ── Filter state ─────────────────────────────────────────────────────────
  selectedYear = signal<string>('all');

  availableYears = computed(() => {
    const years = new Set<string>();
    this.gameNights().forEach((night) => {
      if (night.date) {
        years.add(new Date(night.date).getFullYear().toString());
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  });

  filteredGameNights = computed(() => {
    const year = this.selectedYear();
    const nights = this.gameNights();
    if (year === 'all') return nights;
    return nights.filter(
      (n) => n.date && new Date(n.date).getFullYear().toString() === year
    );
  });

  pastFilteredGameNights = computed(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return this.filteredGameNights().filter(
      (n) => n.date && n.date <= todayStr
    );
  });

  // ── KPI stats ────────────────────────────────────────────────────────────
  totalNights = computed(() => this.pastFilteredGameNights().length);

  totalGamesPlayed = computed(() => {
    let count = 0;
    this.pastFilteredGameNights().forEach((night) => {
      count += (this.allPlayedGames().get(night.id) || []).length;
    });
    return count;
  });

  totalSpent = computed(() => {
    let total = 0;
    this.pastFilteredGameNights().forEach((night) => {
      const games = this.allPlayedGames().get(night.id) || [];
      games.forEach((pg) => {
        Object.values(pg.costs).forEach((cost) => {
          if (cost > 0) total += cost;
        });
      });
    });
    return total;
  });

  // ── Player stats ─────────────────────────────────────────────────────────
  playerStats = computed<PlayerStats[]>(() => {
    const stats = new Map<string, PlayerStats>();

    this.players().forEach((p) => {
      stats.set(p.id, {
        playerId: p.id,
        name: p.name,
        totalCost: 0,
        avgCostPerNight: 0,
        nightsPlayed: 0,
        gamesPlayed: 0,
        wins: 0,
      });
    });

    this.pastFilteredGameNights().forEach((night) => {
      new Set(night.playerIds).forEach((pid) => {
        const s = stats.get(pid);
        if (s) s.nightsPlayed++;
      });

      const pg = this.allPlayedGames().get(night.id) || [];
      pg.forEach((game) => {
        const scores = Object.entries(game.scores);
        const sorted = [...scores].sort((a, b) =>
          game.scoringSystem === 'highest' ? b[1] - a[1] : a[1] - b[1]
        );
        const bestScore = sorted.length > 0 ? sorted[0][1] : null;

        Object.entries(game.costs).forEach(([pid, cost]) => {
          const s = stats.get(pid);
          if (s) {
            s.totalCost += cost;
            s.gamesPlayed++;
          }
        });

        if (bestScore !== null) {
          scores
            .filter(([, score]) => score === bestScore)
            .forEach(([pid]) => {
              const s = stats.get(pid);
              if (s) s.wins++;
            });
        }
      });
    });

    stats.forEach((s) => {
      s.avgCostPerNight =
        s.nightsPlayed > 0 ? s.totalCost / s.nightsPlayed : 0;
    });

    return Array.from(stats.values()).sort(
      (a, b) => b.totalCost - a.totalCost
    );
  });

  sortedByAvgCost = computed(() =>
    [...this.playerStats()]
      .filter((s) => s.nightsPlayed > 0)
      .sort((a, b) => a.avgCostPerNight - b.avgCostPerNight)
  );

  sortedByWins = computed(() =>
    [...this.playerStats()].sort((a, b) => b.wins - a.wins)
  );

  // ── Game stats ───────────────────────────────────────────────────────────
  gameCounts = computed(() => {
    const counts = new Map<string, number>();
    this.pastFilteredGameNights().forEach((night) => {
      const games = this.allPlayedGames().get(night.id) || [];
      games.forEach((pg) => {
        counts.set(pg.gameName, (counts.get(pg.gameName) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  });

  avgGamesPerNight = computed(() => {
    const nights = this.totalNights();
    return nights > 0 ? this.totalGamesPlayed() / nights : 0;
  });

  avgPlayersPerNight = computed(() => {
    const nights = this.pastFilteredGameNights();
    if (nights.length === 0) return 0;
    return nights.reduce((sum, n) => sum + n.playerIds.length, 0) / nights.length;
  });

  mostExpensivePlayer = computed(() => {
    const stats = this.playerStats();
    if (stats.length === 0) return '-';
    const max = stats.reduce((a, b) => (a.totalCost > b.totalCost ? a : b));
    return max.totalCost > 0 ? max.name : '-';
  });

  luckiestPlayer = computed(() => {
    const stats = this.playerStats().filter((s) => s.nightsPlayed > 0);
    if (stats.length === 0) return '-';
    return stats.reduce((a, b) => (a.totalCost < b.totalCost ? a : b)).name;
  });

  // ── Last / Next game night ────────────────────────────────────────────────
  lastGameNight = computed(() => {
    const nights = this.pastFilteredGameNights();
    if (nights.length === 0) return null;
    return [...nights].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
  });

  nextGameNight = computed(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const futureNights = this.gameNights().filter(
      (n) => n.date && n.date > todayStr
    );
    if (futureNights.length === 0) return null;
    return [...futureNights].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )[0];
  });

  lastGameNightPlayedGames = computed(() => {
    const last = this.lastGameNight();
    if (!last) return [];
    return this.allPlayedGames().get(last.id) || [];
  });

  lastGameNightCosts = computed(() => {
    const last = this.lastGameNight();
    const games = this.lastGameNightPlayedGames();
    if (!last) return [];

    const playerTotals = new Map<string, number>();
    last.playerIds.forEach((pid) => playerTotals.set(pid, 0));

    games.forEach((g) => {
      Object.entries(g.costs).forEach(([pid, cost]) => {
        playerTotals.set(pid, (playerTotals.get(pid) || 0) + cost);
      });
    });

    return Array.from(playerTotals.entries())
      .map(([playerId, cost]) => ({
        playerId,
        name: this.players().find((p) => p.id === playerId)?.name || '?',
        cost,
      }))
      .sort((a, b) => a.cost - b.cost);
  });

  // ── Helper methods ────────────────────────────────────────────────────────
  getBarWidth(cost: number): number {
    const maxCost = Math.max(
      ...this.playerStats().map((s) => Math.abs(s.totalCost)),
      1
    );
    return (Math.abs(cost) / maxCost) * 100;
  }

  getGameBarWidth(count: number): number {
    const maxCount = Math.max(...this.gameCounts().map((gc) => gc.count), 1);
    return (count / maxCount) * 100;
  }

  getGameWinners(game: PlayedGame): string {
    const scores = Object.entries(game.scores);
    if (scores.length === 0) return '-';
    const sorted = [...scores].sort((a, b) =>
      game.scoringSystem === 'highest' ? b[1] - a[1] : a[1] - b[1]
    );
    const bestScore = sorted[0][1];
    return scores
      .filter(([, score]) => score === bestScore)
      .map(([pid]) => this.players().find((p) => p.id === pid)?.name || '?')
      .join(' & ');
  }

  getDaysUntil(dateStr: string): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil(
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) return 'heute';
    if (diffDays === 1) return 'morgen';
    if (diffDays === 2) return 'übermorgen';
    return `in ${diffDays} Tagen`;
  }

  // ── Data loading ──────────────────────────────────────────────────────────
  initialize(): void {
    const subs: (() => void)[] = [];

    const sub1 = this.playerService
      .getAll()
      .subscribe((p) => this.players.set(p));

    const sub2 = this.gameNightService.getAll().subscribe((gn) => {
      this.gameNights.set(gn);
      gn.forEach((night) => {
        const sub = this.gameNightService
          .getPlayedGames(night.id)
          .subscribe((pg) => {
            this.allPlayedGames.update((map) => {
              const newMap = new Map(map);
              newMap.set(night.id, pg);
              return newMap;
            });
          });
        subs.push(() => sub.unsubscribe());
      });
    });

    this.destroyRef.onDestroy(() => {
      sub1.unsubscribe();
      sub2.unsubscribe();
      subs.forEach((unsub) => unsub());
    });
  }
}

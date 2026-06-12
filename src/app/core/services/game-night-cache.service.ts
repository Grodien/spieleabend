import { Injectable, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { GameNightService } from './game-night.service';
import { PlayerService } from './player.service';
import { GameNight } from '../models/game-night.model';
import { Player } from '../models/player.model';

/**
 * Singleton cache for GameNights and Players.
 * Provided in root → lives for the entire app session.
 * Calling initialize() more than once is a no-op after the first call,
 * preventing duplicate Firestore listeners when navigating between pages.
 */
@Injectable({ providedIn: 'root' })
export class GameNightCacheService {
  private gameNightService = inject(GameNightService);
  private playerService = inject(PlayerService);

  readonly gameNights = signal<GameNight[]>([]);
  readonly players = signal<Player[]>([]);

  private initialized = false;
  private subscriptions: Subscription[] = [];

  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;

    const sub1 = this.playerService
      .getAll()
      .subscribe((p) => this.players.set(p));

    const sub2 = this.gameNightService
      .getAll()
      .subscribe((gn) => this.gameNights.set(gn));

    this.subscriptions.push(sub1, sub2);
  }

  /**
   * Call this if you need to force a fresh reload (e.g. after migration).
   */
  reset(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.subscriptions = [];
    this.initialized = false;
    this.gameNights.set([]);
    this.players.set([]);
  }
}

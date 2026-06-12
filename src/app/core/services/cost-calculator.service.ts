import { Injectable } from '@angular/core';

/**
 * Calculates per-player costs for individual and team games.
 *
 * ## Einzelspiel (Individual Game)
 * Players sorted by score. Rank 1 pays 0, each subsequent rank pays costPerGame more.
 * Tied scores: sum costs of occupied positions, divide by tied players.
 *
 * ## Teamspiel (Team Game)
 * Players sorted by score and paired into teams of 2 (best two = team 1, next two = team 2, ...).
 * Total cost = costPerGame * numPlayers * (numPlayers - 1) / 2
 * Number of teams = numPlayers / 2
 * Spacing = totalCost / (numTeams * (numTeams - 1) / 2)
 * Team k (0-indexed) pays: spacing * k per player
 *
 * Example: 6 players, 3 CHF: Total=45, 3 teams, spacing=15
 *   Team 0: 0/player, Team 1: 7.50/player, Team 2: 15/player → 0+0+7.5+7.5+15+15=45 ✓
 */
@Injectable({ providedIn: 'root' })
export class CostCalculatorService {
  /**
   * Unified entry point: calculates costs for a played game.
   * scores is always Record<playerId, score> (individual player scores).
   */
  calculateCosts(
    scores: Record<string, number>,
    scoringSystem: 'highest' | 'lowest',
    isTeamGame: boolean,
    costPerGame: number,
  ): Record<string, number> {
    if (isTeamGame) {
      return this.calculateTeamCosts(scores, scoringSystem, costPerGame);
    }
    return this.calculateIndividualCosts(scores, scoringSystem, costPerGame);
  }

  /**
   * Calculate costs for an individual (non-team) game.
   */
  private calculateIndividualCosts(
    scores: Record<string, number>,
    scoringSystem: 'highest' | 'lowest',
    costPerGame: number,
  ): Record<string, number> {
    const entries = Object.entries(scores);
    if (entries.length <= 1) {
      return Object.fromEntries(entries.map(([id]) => [id, 0]));
    }

    // Sort: winner first
    const sorted = [...entries].sort((a, b) =>
      scoringSystem === 'highest' ? b[1] - a[1] : a[1] - b[1],
    );

    // Assign ranks — tied scores share the same rank (0-indexed)
    const ranks: { playerId: string; rank: number }[] = [];
    let currentRank = 0;

    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i][1] !== sorted[i - 1][1]) {
        currentRank = i; // rank jumps to position index
      }
      ranks.push({ playerId: sorted[i][0], rank: currentRank });
    }

    // Group players by rank
    const rankGroups = new Map<number, string[]>();
    for (const { playerId, rank } of ranks) {
      const group = rankGroups.get(rank) ?? [];
      group.push(playerId);
      rankGroups.set(rank, group);
    }

    // Calculate costs per rank group
    const costs: Record<string, number> = {};
    for (const [rank, playerIds] of rankGroups) {
      // Sum the base costs for all positions this group occupies
      const count = playerIds.length;
      let totalGroupCost = 0;
      for (let pos = rank; pos < rank + count; pos++) {
        totalGroupCost += pos * costPerGame;
      }
      const perPlayerCost = totalGroupCost / count;
      for (const id of playerIds) {
        costs[id] = Math.round(perPlayerCost * 100) / 100;
      }
    }

    return costs;
  }

  /**
   * Calculate costs for a team game.
   * Scores are individual player scores. Players are sorted and paired into teams of 2.
   */
  private calculateTeamCosts(
    scores: Record<string, number>,
    scoringSystem: 'highest' | 'lowest',
    costPerGame: number,
  ): Record<string, number> {
    const entries = Object.entries(scores);
    const numPlayers = entries.length;

    if (numPlayers <= 2) {
      return Object.fromEntries(entries.map(([id]) => [id, 0]));
    }

    // Sort players by score (best first)
    const sorted = [...entries].sort((a, b) =>
      scoringSystem === 'highest' ? b[1] - a[1] : a[1] - b[1],
    );

    // Calculate total cost and sum of team indices S
    const totalCost = (costPerGame * numPlayers * (numPlayers - 1)) / 2;
    let S = 0;
    for (let i = 0; i < numPlayers; i++) {
      S += Math.floor(i / 2);
    }

    const spacing = S > 0 ? totalCost / S : 0;
    const costs: Record<string, number> = {};

    for (let i = 0; i < numPlayers; i++) {
      const t = Math.floor(i / 2);
      const costPerPlayer = Math.round(spacing * t * 100) / 100;
      costs[sorted[i][0]] = costPerPlayer;
    }

    return costs;
  }
}

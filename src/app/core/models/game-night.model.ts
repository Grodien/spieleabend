export interface GameNight {
  id: string;
  date: string;
  costPerGame: 3 | 5;
  playerIds: string[];
  createdAt: number;
}

export interface PlayedGame {
  id: string;
  gameId: string;
  gameName: string;
  isTeamGame: boolean;
  scoringSystem: 'highest' | 'lowest';
  scores: Record<string, number>;
  costs: Record<string, number>;
  createdAt: number;
}

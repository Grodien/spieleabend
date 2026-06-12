export interface Game {
  id: string;
  name: string;
  scoringSystem: 'highest' | 'lowest';
  isTeamGame: boolean;
  createdAt: number;
}

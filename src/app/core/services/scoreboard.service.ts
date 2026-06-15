import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase.config';

export interface ScoreboardSession {
  gameNightId: string;
  gameId: string;
  gameName: string;
  scoringSystem: 'highest' | 'lowest';
  isTeamGame: boolean;
  participatingPlayerIds: string[];
  rounds: Record<string, number>[];
  activeGame: boolean;
  updatedAt: number;
}

@Injectable({ providedIn: 'root' })
export class ScoreboardService {
  private readonly collectionName = 'scoreboardSessions';

  // Listen to a scoreboard session in real time
  getSession(gameNightId: string): Observable<ScoreboardSession | null> {
    return new Observable<ScoreboardSession | null>((subscriber) => {
      const docRef = doc(db, this.collectionName, gameNightId);
      const unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            subscriber.next(snapshot.data() as ScoreboardSession);
          } else {
            subscriber.next(null);
          }
        },
        (error) => subscriber.error(error),
      );
      return () => unsubscribe();
    });
  }

  // Create or update a scoreboard session
  async saveSession(gameNightId: string, session: Omit<ScoreboardSession, 'updatedAt'>): Promise<void> {
    const docRef = doc(db, this.collectionName, gameNightId);
    await setDoc(docRef, {
      ...session,
      updatedAt: Date.now(),
    });
  }

  // Delete a scoreboard session when the game is cancelled or completed
  async deleteSession(gameNightId: string): Promise<void> {
    const docRef = doc(db, this.collectionName, gameNightId);
    await deleteDoc(docRef);
  }
}

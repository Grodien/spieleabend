import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase.config';
import { GameNight, PlayedGame } from '../models/game-night.model';

@Injectable({ providedIn: 'root' })
export class GameNightService {
  private readonly collectionName = 'gameNights';

  getAll(): Observable<GameNight[]> {
    return new Observable<GameNight[]>((subscriber) => {
      const q = query(
        collection(db, this.collectionName),
        orderBy('date', 'desc'),
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const gameNights: GameNight[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<GameNight, 'id'>),
            playedGames: (d.data()['playedGames'] as GameNight['playedGames']) ?? [],
          }));
          subscriber.next(gameNights);
        },
        (error) => subscriber.error(error),
      );
      return () => unsubscribe();
    });
  }

  getById(id: string): Observable<GameNight | undefined> {
    return new Observable<GameNight | undefined>((subscriber) => {
      const docRef = doc(db, this.collectionName, id);
      const unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            subscriber.next({
              id: snapshot.id,
              ...(snapshot.data() as Omit<GameNight, 'id'>),
              playedGames: (snapshot.data()['playedGames'] as GameNight['playedGames']) ?? [],
            });
          } else {
            subscriber.next(undefined);
          }
        },
        (error) => subscriber.error(error),
      );
      return () => unsubscribe();
    });
  }

  async create(date: Date, costPerGame: 3 | 5, playerIds: string[]): Promise<string> {
    // Store as YYYY-MM-DD string to avoid timezone issues
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    const docRef = await addDoc(collection(db, this.collectionName), {
      date: dateStr,
      costPerGame,
      playerIds,
      playedGames: [],
      createdAt: Date.now(),
    });
    return docRef.id;
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, this.collectionName, id));
  }

  async update(id: string, data: Partial<Omit<GameNight, 'id' | 'createdAt'>>): Promise<void> {
    await updateDoc(doc(db, this.collectionName, id), data as Record<string, unknown>);
  }

  // ── PlayedGames – now stored as embedded array ──────────────────────────

  async addPlayedGame(
    gameNightId: string,
    data: Omit<PlayedGame, 'id' | 'createdAt'>,
  ): Promise<string> {
    const newId = doc(collection(db, '_ids')).id; // generate a Firestore-style ID
    const newGame: PlayedGame = { ...data, id: newId, createdAt: Date.now() };

    const nightRef = doc(db, this.collectionName, gameNightId);
    const snapshot = await getDoc(nightRef);
    const existing: PlayedGame[] = (snapshot.data()?.['playedGames'] as PlayedGame[]) ?? [];

    await updateDoc(nightRef, { playedGames: [...existing, newGame] });
    return newId;
  }

  async deletePlayedGame(gameNightId: string, playedGameId: string): Promise<void> {
    const nightRef = doc(db, this.collectionName, gameNightId);
    const snapshot = await getDoc(nightRef);
    const existing: PlayedGame[] = (snapshot.data()?.['playedGames'] as PlayedGame[]) ?? [];
    const updated = existing.filter((g) => g.id !== playedGameId);
    await updateDoc(nightRef, { playedGames: updated });
  }

  // ── Migration helpers ────────────────────────────────────────────────────

  /**
   * Returns all gameNights as a one-time snapshot (for migration use only).
   */
  async getAllOnce(): Promise<GameNight[]> {
    const q = query(collection(db, this.collectionName), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<GameNight, 'id'>),
      playedGames: (d.data()['playedGames'] as GameNight['playedGames']) ?? [],
    }));
  }

  /**
   * Returns all playedGames from the legacy subcollection for a given night.
   * Used only during migration.
   */
  async getLegacyPlayedGames(gameNightId: string): Promise<PlayedGame[]> {
    const col = collection(db, this.collectionName, gameNightId, 'playedGames');
    const snapshot = await getDocs(query(col, orderBy('createdAt')));
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<PlayedGame, 'id'>),
    }));
  }
}

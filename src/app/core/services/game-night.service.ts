import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
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
    const docRef = await addDoc(collection(db, this.collectionName), {
      date: date.toISOString(),
      costPerGame,
      playerIds,
      createdAt: Date.now(),
    });
    return docRef.id;
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, this.collectionName, id));
  }

  // --- PlayedGames subcollection ---

  private playedGamesCollection(gameNightId: string) {
    return collection(
      db,
      this.collectionName,
      gameNightId,
      'playedGames',
    );
  }

  getPlayedGames(gameNightId: string): Observable<PlayedGame[]> {
    return new Observable<PlayedGame[]>((subscriber) => {
      const q = query(
        this.playedGamesCollection(gameNightId),
        orderBy('createdAt'),
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const playedGames: PlayedGame[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<PlayedGame, 'id'>),
          }));
          subscriber.next(playedGames);
        },
        (error) => subscriber.error(error),
      );
      return () => unsubscribe();
    });
  }

  async addPlayedGame(
    gameNightId: string,
    data: Omit<PlayedGame, 'id' | 'createdAt'>,
  ): Promise<string> {
    const docRef = await addDoc(
      this.playedGamesCollection(gameNightId),
      {
        ...data,
        createdAt: Date.now(),
      },
    );
    return docRef.id;
  }

  async deletePlayedGame(
    gameNightId: string,
    playedGameId: string,
  ): Promise<void> {
    await deleteDoc(
      doc(
        db,
        this.collectionName,
        gameNightId,
        'playedGames',
        playedGameId,
      ),
    );
  }
}

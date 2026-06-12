import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase.config';
import { Game } from '../models/game.model';

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly collectionName = 'games';

  getAll(): Observable<Game[]> {
    return new Observable<Game[]>((subscriber) => {
      const q = query(
        collection(db, this.collectionName),
        orderBy('name'),
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const games: Game[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Game, 'id'>),
          }));
          subscriber.next(games);
        },
        (error) => subscriber.error(error),
      );
      return () => unsubscribe();
    });
  }

  async create(
    name: string,
    scoringSystem: 'highest' | 'lowest',
    isTeamGame: boolean,
  ): Promise<string> {
    const docRef = await addDoc(collection(db, this.collectionName), {
      name,
      scoringSystem,
      isTeamGame,
      createdAt: Date.now(),
    });
    return docRef.id;
  }

  async update(
    id: string,
    data: Partial<Omit<Game, 'id' | 'createdAt'>>,
  ): Promise<void> {
    await updateDoc(doc(db, this.collectionName, id), data);
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, this.collectionName, id));
  }
}

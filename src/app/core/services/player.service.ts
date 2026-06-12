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
import { Player } from '../models/player.model';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private readonly collectionName = 'players';

  getAll(): Observable<Player[]> {
    return new Observable<Player[]>((subscriber) => {
      const q = query(
        collection(db, this.collectionName),
        orderBy('name'),
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const players: Player[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Player, 'id'>),
          }));
          subscriber.next(players);
        },
        (error) => subscriber.error(error),
      );
      return () => unsubscribe();
    });
  }

  async create(name: string): Promise<string> {
    const docRef = await addDoc(collection(db, this.collectionName), {
      name,
      createdAt: Date.now(),
    });
    return docRef.id;
  }

  async update(id: string, name: string): Promise<void> {
    await updateDoc(doc(db, this.collectionName, id), { name });
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, this.collectionName, id));
  }
}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase.config';
import { AppUser } from './auth.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly collectionName = 'users';

  getAll(): Observable<AppUser[]> {
    return new Observable<AppUser[]>((subscriber) => {
      const q = query(collection(db, this.collectionName));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const users: AppUser[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              uid: d.id,
              email: data['email'] || null,
              displayName: data['displayName'] || null,
              photoURL: data['photoURL'] || null,
              isAdmin: data['isAdmin'] === true,
              isPending: data['isPending'] === true,
            };
          });
          subscriber.next(users);
        },
        (error) => subscriber.error(error),
      );
      return () => unsubscribe();
    });
  }

  async update(id: string, data: Partial<Omit<AppUser, 'uid'>>): Promise<void> {
    await updateDoc(doc(db, this.collectionName, id), data);
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, this.collectionName, id));
  }
}

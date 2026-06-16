import { Injectable, inject, signal, computed } from '@angular/core';
import { 
  Auth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { auth, db } from '../firebase.config';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAdmin: boolean;
  isPending: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private firebaseAuth = auth;

  // Signal for the raw Firebase User
  firebaseUser = signal<User | null>(null);

  // Signal for the app user document from Firestore
  appUser = signal<AppUser | null>(null);

  // Computed signals for easy access
  isLoggedIn = computed(() => this.firebaseUser() !== null);
  isAdmin = computed(() => this.appUser()?.isAdmin === true);
  isPending = computed(() => this.appUser()?.isPending === true);
  isLoaded = signal<boolean>(false);

  private userDocUnsubscribe?: () => void;

  constructor() {
    onAuthStateChanged(this.firebaseAuth, async (user) => {
      this.firebaseUser.set(user);
      
      // Unsubscribe from previous user document listener
      if (this.userDocUnsubscribe) {
        this.userDocUnsubscribe();
        this.userDocUnsubscribe = undefined;
      }

      if (user) {
        // Set up real-time listener for the user document
        const userDocRef = doc(db, 'users', user.uid);
        
        this.userDocUnsubscribe = onSnapshot(userDocRef, async (snapshot) => {
          if (snapshot.exists()) {
            this.appUser.set(snapshot.data() as AppUser);
          } else {
            // First time login - create user document
            const newAppUser: AppUser = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              isAdmin: false, // Default is NOT admin
              isPending: true, // Registrations must be approved
            };
            try {
              await setDoc(userDocRef, newAppUser);
              this.appUser.set(newAppUser);
            } catch (error) {
              console.error('Error creating user document:', error);
            }
          }
          this.isLoaded.set(true);
        }, (error) => {
          console.error('Error listening to user document:', error);
          this.isLoaded.set(true);
        });
      } else {
        this.appUser.set(null);
        this.isLoaded.set(true);
      }
    });
  }

  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(this.firebaseAuth, provider);
  }

  async logout(): Promise<void> {
    await signOut(this.firebaseAuth);
  }
}

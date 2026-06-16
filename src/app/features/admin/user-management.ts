import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserService } from '../../core/services/user.service';
import { AuthService, AppUser } from '../../core/services/auth.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Benutzer verwalten</h1>
      </div>

      <!-- Sektion: Ausstehende Anfragen -->
      @if (pendingUsers().length > 0) {
        <div class="admin-section animate-slide-in">
          <h2 class="section-title">
            <mat-icon>hourglass_empty</mat-icon>
            Ausstehende Anfragen ({{ pendingUsers().length }})
          </h2>
          
          <div class="card-grid">
            @for (user of pendingUsers(); track user.uid; let i = $index) {
              <div class="glass-card user-card pending-card" [style.animation-delay]="i * 50 + 'ms'" style="animation: slideInUp 0.4s ease-out backwards">
                <div class="user-info">
                  @if (user.photoURL) {
                    <img [src]="user.photoURL" class="user-avatar" alt="Avatar" referrerpolicy="no-referrer">
                  } @else {
                    <div class="user-avatar-initial">{{ getUserInitial(user) }}</div>
                  }
                  <div class="user-details">
                    <div class="user-name">{{ user.displayName || 'Unbekannter Name' }}</div>
                    <div class="user-email">{{ user.email }}</div>
                  </div>
                </div>
                
                <div class="action-buttons">
                  <button mat-flat-button color="accent" class="approve-admin-btn" (click)="approveUser(user, true)">
                    <mat-icon>admin_panel_settings</mat-icon>
                    Als Admin freigeben
                  </button>
                  <button mat-stroked-button class="approve-player-btn" (click)="approveUser(user, false)">
                    <mat-icon>person</mat-icon>
                    Als Spieler freigeben
                  </button>
                  <button mat-icon-button color="warn" class="reject-btn" (click)="rejectUser(user)" matTooltip="Ablehnen / Löschen">
                    <mat-icon>delete_outline</mat-icon>
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Sektion: Alle Benutzer -->
      <div class="admin-section">
        <div class="section-header-row">
          <h2 class="section-title">
            <mat-icon>group</mat-icon>
            Alle registrierten Benutzer ({{ filteredUsers().length }})
          </h2>
          
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Suchen...</mat-label>
            <input matInput [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" placeholder="Name oder E-Mail eingeben">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
        </div>

        @if (filteredUsers().length === 0) {
          <div class="empty-state animate-scale-in">
            <div class="empty-icon">👥</div>
            <div class="empty-title">Keine Benutzer gefunden</div>
            <div class="empty-text">Es wurden keine registrierten Benutzer für deine Suche gefunden.</div>
          </div>
        } @else {
          <div class="card-grid">
            @for (user of filteredUsers(); track user.uid; let i = $index) {
              <div class="glass-card user-card" 
                   [class.current-user-card]="user.uid === currentUid"
                   [style.animation-delay]="i * 30 + 'ms'" 
                   style="animation: slideInUp 0.3s ease-out backwards">
                
                <div class="user-info">
                  @if (user.photoURL) {
                    <img [src]="user.photoURL" class="user-avatar" alt="Avatar" referrerpolicy="no-referrer">
                  } @else {
                    <div class="user-avatar-initial">{{ getUserInitial(user) }}</div>
                  }
                  <div class="user-details">
                    <div class="user-name-row">
                      <span class="user-name">{{ user.displayName || 'Unbekannter Name' }}</span>
                      @if (user.uid === currentUid) {
                        <span class="self-badge">Du</span>
                      }
                    </div>
                    <div class="user-email">{{ user.email }}</div>
                    
                    <div class="role-badges">
                      @if (user.isAdmin) {
                        <span class="role-badge badge-admin">
                          <mat-icon>admin_panel_settings</mat-icon> Admin
                        </span>
                      } @else if (user.isPending) {
                        <span class="role-badge badge-pending">
                          <mat-icon>hourglass_empty</mat-icon> Ausstehend
                        </span>
                      } @else {
                        <span class="role-badge badge-player">
                          <mat-icon>person</mat-icon> Spieler
                        </span>
                      }
                    </div>
                  </div>
                </div>

                <div class="user-controls">
                  <mat-checkbox 
                    [checked]="user.isAdmin"
                    [disabled]="user.uid === currentUid"
                    [matTooltip]="user.uid === currentUid ? 'Eigene Admin-Rechte können nicht entzogen werden.' : 'Admin-Rechte gewähren/entziehen'"
                    (change)="toggleAdmin(user, $event.checked)">
                    Admin-Rechte
                  </mat-checkbox>

                  @if (user.uid !== currentUid) {
                    <button mat-icon-button color="warn" (click)="deleteUser(user)" matTooltip="Benutzer löschen">
                      <mat-icon>delete_outline</mat-icon>
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .admin-section {
      margin-bottom: 40px;
    }

    .section-title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--color-text-primary);

      mat-icon {
        color: var(--color-accent);
      }
    }

    .section-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 20px;

      .section-title {
        margin-bottom: 0;
      }
    }

    .search-field {
      width: 300px;
      margin-bottom: -16px;
    }

    .user-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 20px;
      gap: 16px;
      transition: border-color var(--transition-fast), box-shadow var(--transition-fast);

      &.pending-card {
        border-color: rgba(var(--color-accent-rgb), 0.2);
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(var(--color-accent-rgb), 0.03));
      }

      &.current-user-card {
        border-color: rgba(99, 102, 241, 0.3);
      }
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .user-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid rgba(255, 255, 255, 0.1);
    }

    .user-avatar-initial {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--gradient-accent);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 700;
      color: #000;
      border: 2px solid rgba(255, 255, 255, 0.1);
    }

    .user-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
      overflow: hidden;
    }

    .user-name-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .user-name {
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .self-badge {
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.3);
      font-size: 10px;
      font-weight: 600;
      padding: 1px 6px;
      border-radius: 10px;
      text-transform: uppercase;
    }

    .user-email {
      font-size: 13px;
      color: var(--color-text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .role-badges {
      display: flex;
      gap: 8px;
      margin-top: 4px;
    }

    .role-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      gap: 4px;

      mat-icon {
        font-size: 13px;
        width: 13px;
        height: 13px;
      }

      &.badge-admin {
        background: rgba(251, 191, 36, 0.1);
        color: #fbbf24;
        border: 1px solid rgba(251, 191, 36, 0.2);
      }

      &.badge-pending {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
        border: 1px solid rgba(245, 158, 11, 0.2);
      }

      &.badge-player {
        background: rgba(59, 130, 246, 0.1);
        color: #60a5fa;
        border: 1px solid rgba(59, 130, 246, 0.2);
      }
    }

    .action-buttons {
      display: flex;
      gap: 8px;
      width: 100%;
      flex-wrap: wrap;

      button {
        flex-grow: 1;
        font-size: 13px;
      }

      .reject-btn {
        flex-grow: 0;
      }
    }

    .user-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 12px;
      margin-top: 4px;
    }

    @media (max-width: 768px) {
      .section-header-row {
        flex-direction: column;
        align-items: stretch;
      }

      .search-field {
        width: 100%;
      }
      
      .action-buttons {
        flex-direction: column;
        
        .reject-btn {
          align-self: flex-end;
          width: 44px;
        }
      }
    }
  `,
})
export class UserManagementComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  users = signal<AppUser[]>([]);
  searchQuery = signal<string>('');

  get currentUid(): string | undefined {
    return this.authService.firebaseUser()?.uid;
  }

  // Filter out pending users
  pendingUsers = computed(() => {
    return this.users().filter((u) => u.isPending);
  });

  // Filter registered users based on search
  filteredUsers = computed(() => {
    const queryStr = this.searchQuery().toLowerCase().trim();
    const list = this.users();
    
    if (!queryStr) return list;
    
    return list.filter((u) => 
      (u.displayName?.toLowerCase().includes(queryStr) || false) || 
      (u.email?.toLowerCase().includes(queryStr) || false)
    );
  });

  ngOnInit() {
    this.userService.getAll().subscribe((users) => {
      this.users.set(users);
    });
  }

  getUserInitial(user: AppUser): string {
    const name = user.displayName || user.email || '?';
    return name.charAt(0).toUpperCase();
  }

  async approveUser(user: AppUser, asAdmin: boolean) {
    try {
      await this.userService.update(user.uid, {
        isAdmin: asAdmin,
        isPending: false,
      });
      const roleStr = asAdmin ? 'Admin' : 'Spieler';
      this.snackBar.open(`${user.displayName || user.email} freigegeben als ${roleStr}!`, 'OK', { duration: 3000 });
    } catch (e) {
      this.snackBar.open('Fehler bei der Freigabe.', 'OK', { duration: 3000 });
      console.error(e);
    }
  }

  async rejectUser(user: AppUser) {
    if (confirm(`Möchtest du die Anfrage von "${user.displayName || user.email}" wirklich ablehnen und löschen?`)) {
      try {
        await this.userService.delete(user.uid);
        this.snackBar.open(`Anfrage von ${user.displayName || user.email} abgelehnt.`, 'OK', { duration: 3000 });
      } catch (e) {
        this.snackBar.open('Fehler beim Ablehnen.', 'OK', { duration: 3000 });
        console.error(e);
      }
    }
  }

  async toggleAdmin(user: AppUser, isAdmin: boolean) {
    if (user.uid === this.currentUid) {
      this.snackBar.open('Du kannst deine eigenen Admin-Rechte nicht entziehen!', 'OK', { duration: 3000 });
      return;
    }
    
    try {
      await this.userService.update(user.uid, { isAdmin });
      const action = isAdmin ? 'Admin-Rechte gewährt' : 'Admin-Rechte entzogen';
      this.snackBar.open(`${action} für ${user.displayName || user.email}.`, 'OK', { duration: 3000 });
    } catch (e) {
      this.snackBar.open('Fehler beim Aktualisieren der Rolle.', 'OK', { duration: 3000 });
      console.error(e);
    }
  }

  async deleteUser(user: AppUser) {
    if (user.uid === this.currentUid) {
      this.snackBar.open('Du kannst dich nicht selbst löschen!', 'OK', { duration: 3000 });
      return;
    }
    
    if (confirm(`Möchtest du den Benutzer "${user.displayName || user.email}" wirklich dauerhaft löschen?`)) {
      try {
        await this.userService.delete(user.uid);
        this.snackBar.open(`Benutzer ${user.displayName || user.email} gelöscht.`, 'OK', { duration: 3000 });
      } catch (e) {
        this.snackBar.open('Fehler beim Löschen.', 'OK', { duration: 3000 });
        console.error(e);
      }
    }
  }
}

import { Component, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent {
  @Output() toggleNav = new EventEmitter<void>();

  authService = inject(AuthService);
  currentUser = this.authService.currentUser;

  isDark = signal<boolean>(
    document.documentElement.classList.contains('dark') ||
    localStorage.getItem('theme') === 'dark'
  );

  constructor() {
    // Aplicar tema guardado al iniciar
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }

  onToggleNav(): void {
    this.toggleNav.emit();
  }

  onToggleDark(): void {
    const el = document.documentElement;
    const nowDark = el.classList.toggle('dark');
    this.isDark.set(nowDark);
    localStorage.setItem('theme', nowDark ? 'dark' : 'light');
  }

  onLogout(): void {
    this.authService.logout().subscribe();
  }
}

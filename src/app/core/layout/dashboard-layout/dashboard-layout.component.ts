import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TopbarComponent } from '../topbar/topbar.component';
import { SideNavComponent } from '../side-nav/side-nav.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, TopbarComponent, SideNavComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.css']
})
export class DashboardLayoutComponent {
  isNavOpen = signal<boolean>(false);

  toggleNav(): void {
    this.isNavOpen.update((v) => !v);
  }

  closeNav(): void {
    this.isNavOpen.set(false);
  }
}

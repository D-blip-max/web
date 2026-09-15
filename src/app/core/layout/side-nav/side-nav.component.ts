import { Component, Input, Output, EventEmitter, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NAV_MODULES, NavModule } from '../../config/nav-modules.config';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.css']
})
export class SideNavComponent {
  @Input() isOpen = false;
  @Output() closeNav = new EventEmitter<void>();

  private authService = inject(AuthService);

  // Filter modules based on user permissions
  visibleModules = computed<NavModule[]>(() => {
    return NAV_MODULES.filter((module) => {
      if (!module.permission) return true;
      return this.authService.hasPermission(module.permission);
    });
  });

  onModuleClick(): void {
    this.closeNav.emit();
  }

  onClose(): void {
    this.closeNav.emit();
  }
}

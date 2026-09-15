import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  inject,
  effect
} from '@angular/core';
import { AuthService } from '../services/auth.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);

  private requiredPermission = '';
  private hasView = false;

  constructor() {
    effect(() => {
      // Re-evaluate when permissions signal changes
      const perms = this.authService.permissions();
      this.updateView(perms);
    });
  }

  @Input() set appHasPermission(permission: string) {
    this.requiredPermission = permission;
    this.updateView(this.authService.permissions());
  }

  private updateView(userPermissions: string[]) {
    const hasPermission = userPermissions.includes(this.requiredPermission);

    if (hasPermission && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermission && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}

import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { DashboardLayoutComponent } from './core/layout/dashboard-layout/dashboard-layout.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
    canActivate: [guestGuard]
  },
  {
    path: '',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'roles',
        loadComponent: () => import('./features/roles/role-list/role-list.component').then((m) => m.RoleListComponent),
        canActivate: [permissionGuard],
        data: { permission: 'roles.list' }
      },
      {
        path: 'roles/:id/permissions',
        loadComponent: () => import('./features/roles/role-permissions/role-permissions.component').then((m) => m.RolePermissionsComponent),
        canActivate: [permissionGuard],
        data: { permission: 'roles.update' }
      },
      {
        path: 'sucursales',
        loadComponent: () => import('./features/branches/branch-list/branch-list.component').then((m) => m.BranchListComponent),
        canActivate: [permissionGuard],
        data: { permission: 'sucursales.list' }
      },
      {
        path: 'categorias',
        loadComponent: () => import('./features/categories/category-list/category-list.component').then((m) => m.CategoryListComponent),
        canActivate: [permissionGuard],
        data: { permission: 'categorias.list' }
      },
      {
        path: 'productos',
        loadComponent: () => import('./features/products/product-list/product-list.component').then((m) => m.ProductListComponent),
        canActivate: [permissionGuard],
        data: { permission: 'productos.list' }
      },
      {
        path: 'productos/nuevo',
        loadComponent: () => import('./features/products/product-form/product-form.component').then((m) => m.ProductFormComponent),
        canActivate: [permissionGuard],
        data: { permission: 'productos.create' }
      },
      {
        path: 'productos/:id/editar',
        loadComponent: () => import('./features/products/product-form/product-form.component').then((m) => m.ProductFormComponent),
        canActivate: [permissionGuard],
        data: { permission: 'productos.update' }
      },
      {
        path: 'proveedores',
        loadComponent: () => import('./features/suppliers/supplier-list/supplier-list.component').then((m) => m.SupplierListComponent),
        canActivate: [permissionGuard],
        data: { permission: 'proveedores.list' }
      },
      {
        path: 'temporadas',
        loadComponent: () => import('./features/seasons/season-list/season-list.component').then((m) => m.SeasonListComponent),
        canActivate: [permissionGuard],
        data: { permission: 'temporadas.list' }
      },
      {
        path: 'inventario',
        loadComponent: () => import('./features/inventory/inventory-stock/inventory-stock.component').then((m) => m.InventoryStockComponent),
        canActivate: [permissionGuard],
        data: { permission: 'inventario.list' }
      },
      {
        path: 'inventario/recepcion',
        loadComponent: () => import('./features/inventory/inventory-reception/inventory-reception.component').then((m) => m.InventoryReceptionComponent),
        canActivate: [permissionGuard],
        data: { permission: 'inventario.create' }
      },
      {
        path: 'inventario/movimientos',
        loadComponent: () => import('./features/inventory/inventory-movements/inventory-movements.component').then((m) => m.InventoryMovementsComponent),
        canActivate: [permissionGuard],
        data: { permission: 'inventario.list' }
      },
      {
        path: 'reservas',
        loadComponent: () => import('./features/reservations/reservation-list/reservation-list.component').then((m) => m.ReservationListComponent),
        canActivate: [permissionGuard],
        data: { permission: 'reservas.list' }
      },
      {
        path: 'reservas/nueva',
        loadComponent: () => import('./features/reservations/reservation-form/reservation-form.component').then((m) => m.ReservationFormComponent),
        canActivate: [permissionGuard],
        data: { permission: 'reservas.create' }
      },
      {
        path: 'ventas',
        loadComponent: () => import('./features/sales/sale-list/sale-list.component').then((m) => m.SaleListComponent),
        canActivate: [permissionGuard],
        data: { permission: 'ventas.list' }
      },
      {
        path: 'ventas/pos',
        loadComponent: () => import('./features/sales/pos/pos.component').then((m) => m.PosComponent),
        canActivate: [permissionGuard],
        data: { permission: 'ventas.create' }
      },
      {
        path: 'ventas/reportes',
        loadComponent: () => import('./features/sales/sale-reports/sale-reports.component').then((m) => m.SaleReportsComponent),
        canActivate: [permissionGuard],
        data: { permission: 'ventas.reports' }
      },
      {
        path: 'reportes-ia',
        loadComponent: () => import('./features/voice-reports/voice-reports.component').then((m) => m.VoiceReportsComponent),
        canActivate: [permissionGuard],
        data: { permission: 'ventas.reports' }
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

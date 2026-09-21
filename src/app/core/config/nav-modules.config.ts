export interface NavModule {
  label: string;
  icon: string;          // Bootstrap icon class name, e.g. "bi-shield-lock"
  route: string;
  permission?: string;   // Optional permission code required to see the item
}

export const NAV_MODULES: NavModule[] = [
  {
    label: 'Dashboard',
    icon: 'bi-speedometer2',
    route: '/dashboard'
  },
  {
    label: 'Roles y Permisos',
    icon: 'bi-shield-lock',
    route: '/roles',
    permission: 'roles.list'
  },
  {
    label: 'Sucursales',
    icon: 'bi-shop',
    route: '/sucursales',
    permission: 'sucursales.list'
  },
  {
    label: 'Categorías',
    icon: 'bi-tags',
    route: '/categorias',
    permission: 'categorias.list'
  },
  {
    label: 'Catálogo de Productos',
    icon: 'bi-box-seam',
    route: '/productos',
    permission: 'productos.list'
  },
  {
    label: 'Proveedores',
    icon: 'bi-truck',
    route: '/proveedores',
    permission: 'proveedores.list'
  },
  {
    label: 'Temporadas',
    icon: 'bi-calendar-range',
    route: '/temporadas',
    permission: 'temporadas.list'
  },
  {
    label: 'Inventario / Stock',
    icon: 'bi-boxes',
    route: '/inventario',
    permission: 'inventario.list'
  },
  {
    label: 'Recepción de Mercadería',
    icon: 'bi-box-arrow-in-down',
    route: '/inventario/recepcion',
    permission: 'inventario.create'
  },
  {
    label: 'Movimientos de Stock',
    icon: 'bi-clock-history',
    route: '/inventario/movimientos',
    permission: 'inventario.list'
  },
  {
    label: 'Gestión de Reservas',
    icon: 'bi-calendar-check',
    route: '/reservas',
    permission: 'reservas.list'
  },
  {
    label: 'Nueva Reserva',
    icon: 'bi-bookmark-plus',
    route: '/reservas/nueva',
    permission: 'reservas.create'
  },
  {
    label: 'Caja / POS',
    icon: 'bi-calculator',
    route: '/ventas/pos',
    permission: 'ventas.create'
  },
  {
    label: 'Historial de Ventas',
    icon: 'bi-receipt',
    route: '/ventas',
    permission: 'ventas.list'
  },
  {
    label: 'Reportes de Ventas',
    icon: 'bi-graph-up',
    route: '/ventas/reportes',
    permission: 'ventas.reports'
  },
  {
    label: 'Reportes por Voz (IA)',
    icon: 'bi-mic-fill',
    route: '/reportes-ia',
    permission: 'ventas.reports'
  }
];

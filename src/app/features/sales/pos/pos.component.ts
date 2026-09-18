import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SaleService } from '../../../core/services/sale.service';
import { BranchService } from '../../../core/services/branch.service';
import { ProductService } from '../../../core/services/product.service';
import { ReservationService } from '../../../core/services/reservation.service';
import { PayPalService } from '../../../core/services/paypal.service';
import { Branch } from '../../../core/models/branch.model';
import { Sale, PaymentMethod } from '../../../core/models/sale.model';
import { Reservation } from '../../../core/models/reservation.model';
import { HasPermissionDirective } from '../../../core/directives/has-permission.directive';

interface CartItem {
  varianteId: string;
  productoNombre: string;
  sku: string;
  talla: string;
  color: string;
  precioUnitario: number;
  cantidad: number;
  reservaId?: string;
}

interface VariantCatalogItem {
  id: string;
  productoNombre: string;
  sku: string;
  talla: string;
  color: string;
  precio: number;
  categoriaNombre?: string;
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HasPermissionDirective],
  templateUrl: './pos.component.html',
  styleUrls: ['./pos.component.css']
})
export class PosComponent implements OnInit {
  private saleService = inject(SaleService);
  private branchService = inject(BranchService);
  private productService = inject(ProductService);
  private reservationService = inject(ReservationService);
  private paypalService = inject(PayPalService);

  branches = signal<Branch[]>([]);
  selectedBranchId = signal<string>('');
  
  // Catalog search
  catalog = signal<VariantCatalogItem[]>([]);
  searchTerm = signal<string>('');
  filteredCatalog = signal<VariantCatalogItem[]>([]);

  // Prepared reservations for current branch
  preparedReservations = signal<Reservation[]>([]);
  selectedReservationId = signal<string>('');

  // Cart state
  cart = signal<CartItem[]>([]);

  // Payment state
  paymentMethod: PaymentMethod = 'EFECTIVO';
  montoRecibido: number = 0;
  referenciaPago: string = '';
  notaVenta: string = '';
  isPayPalLoading = signal<boolean>(false);
  paypalExchangeRate = signal<number>(6.96);

  // UI state
  isLoading = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  
  // Receipt modal
  completedSale = signal<Sale | null>(null);
  showReceiptModal = signal<boolean>(false);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    this.branchService.getBranches(true).subscribe({
      next: (bList) => {
        this.branches.set(bList);
        if (bList.length > 0) {
          this.selectedBranchId.set(bList[0].id);
          this.loadBranchReservations();
        }
      }
    });

    this.productService.getProducts().subscribe({
      next: (pList) => {
        const items: VariantCatalogItem[] = [];
        pList.forEach((p) => {
          if (p.variantes) {
            p.variantes.forEach((v) => {
              const precio = Number(p.precio_base) + Number(v.precio_extra || 0);
              items.push({
                id: v.id,
                productoNombre: p.nombre,
                sku: v.sku,
                talla: v.talla,
                color: v.color,
                precio: precio,
                categoriaNombre: p.categoria?.nombre
              });
            });
          }
        });
        this.catalog.set(items);
        this.filterCatalog('');
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onBranchChange(branchId: string): void {
    this.selectedBranchId.set(branchId);
    this.cart.set([]);
    this.loadBranchReservations();
  }

  loadBranchReservations(): void {
    const bId = this.selectedBranchId();
    if (!bId) return;

    this.reservationService.getReservations({
      sucursal_id: bId
    }).subscribe({
      next: (resList) => {
        const billable = resList.filter(
          (r) => r.estado === 'PREPARADA' || r.estado === 'PENDIENTE'
        );
        this.preparedReservations.set(billable);
      },
      error: () => {}
    });
  }

  filterCatalog(query: string): void {
    this.searchTerm.set(query);
    const q = query.toLowerCase().trim();
    if (!q) {
      this.filteredCatalog.set(this.catalog().slice(0, 12));
    } else {
      const results = this.catalog().filter((c) =>
        c.productoNombre.toLowerCase().includes(q) ||
        c.sku.toLowerCase().includes(q) ||
        c.color.toLowerCase().includes(q) ||
        c.talla.toLowerCase().includes(q)
      );
      this.filteredCatalog.set(results.slice(0, 20));
    }
  }

  addToCart(item: VariantCatalogItem): void {
    const current = [...this.cart()];
    const index = current.findIndex((c) => c.varianteId === item.id && !c.reservaId);

    if (index >= 0) {
      current[index].cantidad += 1;
    } else {
      current.push({
        varianteId: item.id,
        productoNombre: item.productoNombre,
        sku: item.sku,
        talla: item.talla,
        color: item.color,
        precioUnitario: item.precio,
        cantidad: 1
      });
    }

    this.cart.set(current);
    this.autoFillCashAmount();
  }

  loadReservationToCart(resId: string): void {
    const res = this.preparedReservations().find((r) => r.id === resId);
    if (!res) return;

    const newCart: CartItem[] = [];
    res.detalles.forEach((d) => {
      newCart.push({
        varianteId: d.variante_id,
        productoNombre: d.producto_nombre || 'Prenda Reservada',
        sku: d.variante_sku || '',
        talla: d.talla || '',
        color: d.color || '',
        precioUnitario: Number(d.precio_unitario),
        cantidad: d.cantidad,
        reservaId: res.id
      });
    });

    this.cart.set(newCart);
    this.notaVenta = `Liquidación de reserva ${res.codigo}`;
    this.autoFillCashAmount();
  }

  updateQuantity(index: number, delta: number): void {
    const current = [...this.cart()];
    current[index].cantidad += delta;
    if (current[index].cantidad <= 0) {
      current.splice(index, 1);
    }
    this.cart.set(current);
    this.autoFillCashAmount();
  }

  removeFromCart(index: number): void {
    const current = [...this.cart()];
    current.splice(index, 1);
    this.cart.set(current);
    this.autoFillCashAmount();
  }

  clearCart(): void {
    this.cart.set([]);
    this.montoRecibido = 0;
    this.referenciaPago = '';
    this.notaVenta = '';
    this.selectedReservationId.set('');
  }

  getTotal(): number {
    return this.cart().reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0);
  }

  getCambio(): number {
    if (this.paymentMethod !== 'EFECTIVO' || !this.montoRecibido) return 0;
    return Math.max(0, this.montoRecibido - this.getTotal());
  }

  setExactCash(): void {
    this.montoRecibido = this.getTotal();
  }

  addCash(amount: number): void {
    this.montoRecibido = (this.montoRecibido || 0) + amount;
  }

  autoFillCashAmount(): void {
    if (this.paymentMethod === 'EFECTIVO') {
      this.montoRecibido = this.getTotal();
    }
  }

  selectPaymentMethod(method: PaymentMethod): void {
    this.paymentMethod = method;
    this.errorMessage.set(null);
    if (method === 'EFECTIVO') {
      this.autoFillCashAmount();
    } else if (method === 'PAYPAL') {
      this.renderPayPalButtons();
    }
  }

  getUsdAmount(): number {
    const rate = this.paypalExchangeRate() || 6.96;
    return Number((this.getTotal() / rate).toFixed(2));
  }

  renderPayPalButtons(): void {
    if (this.cart().length === 0) return;
    this.isPayPalLoading.set(true);

    setTimeout(() => {
      const container = document.getElementById('paypal-button-container');
      if (!container) return;
      container.innerHTML = '';

      this.paypalService.loadScript().then((paypal) => {
        this.isPayPalLoading.set(false);
        if (!paypal || !paypal.Buttons) return;

        paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'pay'
          },
          createOrder: () => {
            return new Promise((resolve, reject) => {
              const payload = {
                monto_bob: this.getTotal(),
                sucursal_id: this.selectedBranchId(),
                reserva_id: this.selectedReservationId() || undefined,
                descripcion: `Venta POS FICCT STORE (${this.cart().length} prendas)`,
                items: this.cart().map((item) => ({
                  name: `${item.productoNombre} (${item.talla}/${item.color})`,
                  quantity: item.cantidad,
                  unit_amount_bob: item.precioUnitario
                }))
              };

              this.paypalService.createOrder(payload).subscribe({
                next: (res) => resolve(res.order_id),
                error: (err) => {
                  this.errorMessage.set(err.error?.detail || 'Error al generar la orden en PayPal');
                  reject(err);
                }
              });
            });
          },
          onApprove: (data: any) => {
            this.isSubmitting.set(true);
            const capturePayload = {
              order_id: data.orderID,
              sucursal_id: this.selectedBranchId(),
              reserva_id: this.selectedReservationId() || undefined,
              detalles: this.cart().map((item) => ({
                variante_id: item.varianteId,
                cantidad: item.cantidad,
                precio_unitario: item.precioUnitario,
                reserva_id: item.reservaId
              })),
              nota: `Cobro en mostrador POS vía PayPal Sandbox`
            };

            this.paypalService.captureOrder(capturePayload).subscribe({
              next: (res) => {
                this.isSubmitting.set(false);
                this.completedSale.set(res.venta);
                this.showReceiptModal.set(true);
                this.clearCart();
                this.loadBranchReservations();
              },
              error: (err) => {
                this.isSubmitting.set(false);
                this.errorMessage.set(err.error?.detail || 'Error al capturar el pago en PayPal');
              }
            });
          },
          onError: (err: any) => {
            console.error('PayPal error:', err);
            this.errorMessage.set('Ocurrió un error al procesar el pago con PayPal.');
          }
        }).render('#paypal-button-container');
      }).catch((err) => {
        this.isPayPalLoading.set(false);
        this.errorMessage.set('No se pudo cargar el SDK de PayPal.');
      });
    }, 150);
  }

  processSale(): void {
    if (this.cart().length === 0 || !this.selectedBranchId()) return;

    if (this.paymentMethod === 'EFECTIVO' && this.montoRecibido < this.getTotal()) {
      this.errorMessage.set('El monto recibido no cubre el total de la venta.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const payload = {
      sucursal_id: this.selectedBranchId(),
      items: this.cart().map((item) => ({
        variante_id: item.varianteId,
        cantidad: item.cantidad,
        precio_unitario: item.precioUnitario,
        reserva_id: item.reservaId
      })),
      pago: {
        metodo: this.paymentMethod,
        monto_recibido: this.paymentMethod === 'EFECTIVO' ? Number(this.montoRecibido) : undefined,
        referencia: this.referenciaPago || undefined
      },
      nota: this.notaVenta || undefined
    };

    this.saleService.createPresencialSale(payload).subscribe({
      next: (sale) => {
        this.isSubmitting.set(false);
        this.completedSale.set(sale);
        this.showReceiptModal.set(true);
        this.clearCart();
        this.loadBranchReservations();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.detail || 'Error al procesar la venta');
      }
    });
  }

  closeReceiptModal(): void {
    this.showReceiptModal.set(false);
    this.completedSale.set(null);
  }

  printReceipt(): void {
    window.print();
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Sale } from '../models/sale.model';

export interface PayPalConfig {
  client_id: string;
  mode: string;
  exchange_rate: number;
  currency: string;
}

export interface PayPalCreateOrderResponse {
  order_id: string;
  status: string;
  monto_bob: number;
  monto_usd: number;
  exchange_rate: number;
  approve_url?: string;
}

export interface PayPalCaptureResponse {
  venta: Sale;
  paypal_order_id: string;
  paypal_capture_id: string;
  paypal_status: string;
  monto_usd: number;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class PayPalService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/payments/paypal`;

  private config: PayPalConfig | null = null;
  private scriptLoadingPromise: Promise<any> | null = null;

  getConfig(): Observable<PayPalConfig> {
    if (this.config) {
      return of(this.config);
    }
    return this.http.get<PayPalConfig>(`${this.apiUrl}/config`).pipe(
      tap((cfg) => {
        this.config = cfg;
      })
    );
  }

  loadScript(): Promise<any> {
    if (window.paypal) {
      return Promise.resolve(window.paypal);
    }

    if (this.scriptLoadingPromise) {
      return this.scriptLoadingPromise;
    }

    this.scriptLoadingPromise = new Promise((resolve, reject) => {
      this.getConfig().subscribe({
        next: (cfg) => {
          const script = document.createElement('script');
          script.src = `https://www.paypal.com/sdk/js?client-id=${cfg.client_id}&currency=${cfg.currency || 'USD'}&intent=capture`;
          script.async = true;
          script.onload = () => {
            if (window.paypal) {
              resolve(window.paypal);
            } else {
              reject(new Error('PayPal SDK failed to load.'));
            }
          };
          script.onerror = (err) => {
            this.scriptLoadingPromise = null;
            reject(err);
          };
          document.body.appendChild(script);
        },
        error: (err) => {
          this.scriptLoadingPromise = null;
          reject(err);
        }
      });
    });

    return this.scriptLoadingPromise;
  }

  createOrder(payload: {
    monto_bob: number;
    sucursal_id?: string;
    cliente_id?: string;
    reserva_id?: string;
    descripcion?: string;
    items?: Array<{ name: string; quantity: number; unit_amount_bob: number }>;
  }): Observable<PayPalCreateOrderResponse> {
    return this.http.post<PayPalCreateOrderResponse>(`${this.apiUrl}/create-order`, payload);
  }

  captureOrder(payload: {
    order_id: string;
    sucursal_id: string;
    detalles: Array<{ variante_id: string; cantidad: number; precio_unitario?: number }>;
    cliente_id?: string;
    reserva_id?: string;
    nota?: string;
  }): Observable<PayPalCaptureResponse> {
    return this.http.post<PayPalCaptureResponse>(`${this.apiUrl}/capture-order`, payload);
  }
}

import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpeechRecognitionService } from '../../core/services/speech-recognition.service';
import { VoiceReportsService } from '../../core/services/voice-reports.service';
import { VoiceReportQueryResponse } from '../../core/models/voice-report.model';

@Component({
  selector: 'app-voice-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './voice-reports.component.html',
  styleUrls: ['./voice-reports.component.css']
})
export class VoiceReportsComponent {
  speechService = inject(SpeechRecognitionService);
  reportService = inject(VoiceReportsService);

  queryText = signal<string>('');
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  currentReport = signal<VoiceReportQueryResponse | null>(null);
  showSql = signal<boolean>(false);

  suggestions: string[] = [
    'Top 5 productos más vendidos',
    'Clientes con mayor total de compras',
    'Productos con stock bajo o agotado',
    'Ventas totales agrupadas por sucursal',
    'Ingresos agrupados por método de pago',
    'Últimas 10 ventas completadas'
  ];

  constructor() {
    // Sincronizar la transcripción en vivo del micrófono con el input
    effect(() => {
      const transcript = this.speechService.transcript();
      if (transcript) {
        this.queryText.set(transcript);
      }
    });

    // Sincronizar errores de micrófono
    effect(() => {
      const speechErr = this.speechService.error();
      if (speechErr) {
        this.errorMessage.set(speechErr);
      }
    });
  }

  toggleMicrophone(): void {
    if (this.speechService.isListening()) {
      this.speechService.stopListening();
    } else {
      this.speechService.startListening();
    }
  }

  useSuggestion(suggestion: string): void {
    this.queryText.set(suggestion);
    this.executeQuery();
  }

  executeQuery(): void {
    const text = this.queryText().trim();
    if (!text) {
      this.errorMessage.set('Por favor escribe o di una pregunta para generar el reporte.');
      return;
    }

    // Detener micrófono si sigue escuchando
    if (this.speechService.isListening()) {
      this.speechService.stopListening();
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.reportService.queryReport(text).subscribe({
      next: (response) => {
        this.currentReport.set(response);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        const detail = err.error?.detail || 'No se pudo generar el reporte. Por favor intenta reformular tu pregunta.';
        this.errorMessage.set(detail);
      }
    });
  }

  toggleSql(): void {
    this.showSql.update((v) => !v);
  }

  exportPdf(): void {
    const rep = this.currentReport();
    if (rep) {
      this.reportService.exportToPdf(rep);
    }
  }

  exportCsv(): void {
    const rep = this.currentReport();
    if (rep) {
      this.reportService.exportToCsv(rep);
    }
  }

  formatHeader(col: string): string {
    return this.reportService.formatColumnHeader(col);
  }

  formatValue(col: string, val: any): string {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'number') {
      const colLower = col.toLowerCase();
      if (colLower.includes('precio') || colLower.includes('monto') || colLower.includes('total') || colLower.includes('ingreso') || colLower.includes('bs')) {
        return `Bs. ${val.toFixed(2)}`;
      }
      return Number.isInteger(val) ? val.toString() : val.toFixed(2);
    }
    return String(val);
  }
}

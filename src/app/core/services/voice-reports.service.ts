import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { VoiceReportQueryRequest, VoiceReportQueryResponse } from '../models/voice-report.model';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class VoiceReportsService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/reportes-voz`;

  queryReport(pregunta: string, limite: number = 100): Observable<VoiceReportQueryResponse> {
    const payload: VoiceReportQueryRequest = {
      pregunta: pregunta.trim(),
      limite
    };
    return this.http.post<VoiceReportQueryResponse>(`${this.API_URL}/query`, payload);
  }

  exportToPdf(report: VoiceReportQueryResponse): void {
    if (!report || !report.columnas || report.columnas.length === 0) return;

    const doc = new jsPDF();

    // Encabezado corporativo
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text('Reporte Gerencial con IA', 14, 18);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // Slate-500
    const fechaHora = new Date().toLocaleString('es-BO', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    doc.text(`Fecha y hora de emisión: ${fechaHora}`, 14, 25);
    doc.text(`Consulta efectuada: "${report.pregunta}"`, 14, 31);

    let startY = 38;
    if (report.interpretacion) {
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const splitText = doc.splitTextToSize(`Resumen: ${report.interpretacion}`, 180);
      doc.text(splitText, 14, startY);
      startY += splitText.length * 5 + 4;
    }

    // Preparar datos de la tabla
    const head = [report.columnas.map((c) => this.formatColumnHeader(c))];
    const body = report.filas.map((row) =>
      report.columnas.map((col) => this.formatCellValue(row[col]))
    );

    autoTable(doc, {
      startY: startY,
      head: head,
      body: body,
      theme: 'striped',
      headStyles: {
        fillColor: [59, 130, 246], // Primary Blue
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 3,
        overflow: 'linebreak'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: 14, right: 14 }
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    doc.save(`reporte_ia_${timestamp}.pdf`);
  }

  exportToCsv(report: VoiceReportQueryResponse): void {
    if (!report || !report.columnas || report.columnas.length === 0) return;

    const headers = report.columnas.map((c) => `"${this.formatColumnHeader(c)}"`).join(',');
    const rows = report.filas.map((row) =>
      report.columnas
        .map((col) => {
          let val = String(row[col] ?? '');
          if (val.includes(',') || val.includes('"') || val.includes('\n')) {
            val = `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        })
        .join(',')
    );

    const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte_ia_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  formatColumnHeader(col: string): string {
    return col
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  formatCellValue(val: any): string {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'number') {
      return Number.isInteger(val) ? val.toString() : val.toFixed(2);
    }
    return String(val);
  }
}

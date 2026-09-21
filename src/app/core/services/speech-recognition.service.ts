import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SpeechRecognitionService {
  private recognition: any = null;

  isSupported = signal<boolean>(false);
  isListening = signal<boolean>(false);
  transcript = signal<string>('');
  error = signal<string | null>(null);

  constructor() {
    this.initSpeechRecognition();
  }

  private initSpeechRecognition(): void {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      this.isSupported.set(false);
      return;
    }

    this.isSupported.set(true);

    try {
      this.recognition = new SpeechRecognitionAPI();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'es-ES';

      this.recognition.onstart = () => {
        this.isListening.set(true);
        this.error.set(null);
      };

      this.recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        this.transcript.set(currentTranscript);
      };

      this.recognition.onerror = (event: any) => {
        this.isListening.set(false);
        if (event.error === 'not-allowed') {
          this.error.set('Permiso de micrófono denegado. Por favor, habilita el micrófono en el navegador.');
        } else if (event.error === 'no-speech') {
          this.error.set('No se detectó audio. Por favor, intenta hablar más cerca del micrófono.');
        } else {
          this.error.set(`Error de reconocimiento de voz: ${event.error}`);
        }
      };

      this.recognition.onend = () => {
        this.isListening.set(false);
      };
    } catch (err) {
      this.isSupported.set(false);
      console.warn('SpeechRecognition no pudo inicializarse:', err);
    }
  }

  startListening(): void {
    if (!this.isSupported()) {
      this.error.set('Tu navegador no soporta reconocimiento de voz nativo (Web Speech API). Puedes escribir tu pregunta manualmente.');
      return;
    }

    if (this.isListening()) {
      this.stopListening();
      return;
    }

    this.transcript.set('');
    this.error.set(null);

    try {
      this.recognition.start();
    } catch (err: any) {
      console.warn('Error al iniciar micrófono:', err);
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening()) {
      try {
        this.recognition.stop();
      } catch (err) {
        // silent
      }
      this.isListening.set(false);
    }
  }

  resetTranscript(): void {
    this.transcript.set('');
    this.error.set(null);
  }
}

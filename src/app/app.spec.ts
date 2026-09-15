import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { AppComponent } from './app';

describe('AppComponent', () => {
  it('should create the app instance', () => {
    const app = new AppComponent();
    expect(app).toBeTruthy();
    expect(app.title).toBe('web-app');
  });
});


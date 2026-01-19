import { Injectable, NgZone } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KonamiService {
  private konamiCode = [
    'ArrowUp', 'ArrowUp',
    'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight',
    'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
  ];
  private currentIndex = 0;
  private konamiActivated = new Subject<void>();

  konamiActivated$ = this.konamiActivated.asObservable();

  constructor(private ngZone: NgZone) {
    this.initListener();
  }

  private initListener(): void {
    this.ngZone.runOutsideAngular(() => {
      document.addEventListener('keydown', (event: KeyboardEvent) => {
        this.handleKeyPress(event.code);
      });
    });
  }

  private handleKeyPress(code: string): void {
    if (code === this.konamiCode[this.currentIndex]) {
      this.currentIndex++;

      if (this.currentIndex === this.konamiCode.length) {
        this.ngZone.run(() => {
          this.konamiActivated.next();
        });
        this.currentIndex = 0;
      }
    } else {
      this.currentIndex = code === this.konamiCode[0] ? 1 : 0;
    }
  }
}

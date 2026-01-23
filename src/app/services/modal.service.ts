import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Modal identifiers for type safety
 */
export type ModalId = 'chess-puzzle' | 'soccer-game' | null;

/**
 * Service for managing modal state across the application.
 * Ensures only one modal is open at a time.
 */
@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private activeModal$ = new BehaviorSubject<ModalId>(null);

  /**
   * Observable of the currently active modal
   */
  get activeModal(): Observable<ModalId> {
    return this.activeModal$.asObservable();
  }

  /**
   * Get current modal value synchronously
   */
  get currentModal(): ModalId {
    return this.activeModal$.getValue();
  }

  /**
   * Check if a specific modal is open
   */
  isOpen(modalId: ModalId): boolean {
    return this.activeModal$.getValue() === modalId;
  }

  /**
   * Check if any modal is currently open
   */
  isAnyOpen(): boolean {
    return this.activeModal$.getValue() !== null;
  }

  /**
   * Open a modal by ID. Closes any currently open modal first.
   */
  open(modalId: ModalId): void {
    this.activeModal$.next(modalId);
  }

  /**
   * Close the currently open modal
   */
  close(): void {
    this.activeModal$.next(null);
  }

  /**
   * Toggle a modal - open if closed, close if open
   */
  toggle(modalId: ModalId): void {
    if (this.isOpen(modalId)) {
      this.close();
    } else {
      this.open(modalId);
    }
  }
}

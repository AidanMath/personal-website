import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-konami-secret',
  imports: [CommonModule],
  templateUrl: './konami-secret.component.html',
  styleUrl: './konami-secret.component.scss'
})
export class KonamiSecretComponent {
  @Output() close = new EventEmitter<void>();

  secrets = [
    { icon: 'fas fa-rocket', text: 'You found the Konami Code!' },
    { icon: 'fas fa-gamepad', text: 'Achievement Unlocked: Retro Gamer' },
    { icon: 'fas fa-code', text: 'console.log("Hello, fellow developer!")' },
    { icon: 'fas fa-heart', text: 'Thanks for exploring my portfolio!' }
  ];

  onClose(): void {
    this.close.emit();
  }
}

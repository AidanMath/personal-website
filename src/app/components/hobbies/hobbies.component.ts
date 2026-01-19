import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Hobby {
  id: string;
  title: string;
  icon: string;
  description: string;
  funFact: string;
  color: string;
}

@Component({
  selector: 'app-hobbies',
  imports: [CommonModule],
  templateUrl: './hobbies.component.html',
  styleUrl: './hobbies.component.scss'
})
export class HobbiesComponent {
  @Output() openChessPuzzle = new EventEmitter<void>();
  @Output() activateSoccerBall = new EventEmitter<void>();

  hobbies: Hobby[] = [
    {
      id: 'soccer',
      title: 'Soccer',
      icon: 'fas fa-futbol',
      description: 'Lifelong fan of the beautiful game. Whether playing, watching, or analyzing tactics, soccer is my go-to sport.',
      funFact: 'Click the ball to unleash some physics!',
      color: '#22c55e'
    },
    {
      id: 'chess',
      title: 'Chess',
      icon: 'fas fa-chess',
      description: 'Strategy and pattern recognition - chess sharpens the mind. I enjoy studying openings, tactics, and endgames.',
      funFact: 'Try solving a puzzle below!',
      color: '#8b5cf6'
    },
    {
      id: 'gaming',
      title: 'Factorio',
      icon: 'fas fa-industry',
      description: 'The factory must grow! Optimizing production lines and logistics in Factorio scratches that engineering itch.',
      funFact: 'SPM (Science Per Minute) is the true measure of success.',
      color: '#f97316'
    }
  ];

  onHobbyClick(hobbyId: string): void {
    if (hobbyId === 'chess') {
      this.openChessPuzzle.emit();
    } else if (hobbyId === 'soccer') {
      this.activateSoccerBall.emit();
    }
  }
}

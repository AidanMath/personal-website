import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  imports: [CommonModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent {
  skills = [
    { name: 'TypeScript', icon: 'fab fa-js-square', color: '#3178c6' },
    { name: 'Angular', icon: 'fab fa-angular', color: '#dd0031' },
    { name: 'Python', icon: 'fab fa-python', color: '#3776ab' },
    { name: 'Node.js', icon: 'fab fa-node-js', color: '#339933' },
    { name: 'Git', icon: 'fab fa-git-alt', color: '#f05032' },
    { name: 'Docker', icon: 'fab fa-docker', color: '#2496ed' },
    { name: 'AWS', icon: 'fab fa-aws', color: '#ff9900' },
    { name: 'Linux', icon: 'fab fa-linux', color: '#fcc624' }
  ];
}

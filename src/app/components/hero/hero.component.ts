import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hero',
  imports: [CommonModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss'
})
export class HeroComponent implements OnInit, OnDestroy {
  taglines = [
    'Software Developer',
    'Problem Solver',
    'Chess Enthusiast',
    'Factorio Addict'
  ];
  currentTagline = '';
  currentIndex = 0;
  isDeleting = false;
  private typingSpeed = 100;
  private deletingSpeed = 50;
  private pauseDuration = 2000;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.type();
  }

  ngOnDestroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  private type(): void {
    const fullText = this.taglines[this.currentIndex];

    if (this.isDeleting) {
      this.currentTagline = fullText.substring(0, this.currentTagline.length - 1);
    } else {
      this.currentTagline = fullText.substring(0, this.currentTagline.length + 1);
    }

    let delay = this.isDeleting ? this.deletingSpeed : this.typingSpeed;

    if (!this.isDeleting && this.currentTagline === fullText) {
      delay = this.pauseDuration;
      this.isDeleting = true;
    } else if (this.isDeleting && this.currentTagline === '') {
      this.isDeleting = false;
      this.currentIndex = (this.currentIndex + 1) % this.taglines.length;
      delay = 500;
    }

    this.timeoutId = setTimeout(() => this.type(), delay);
  }

  scrollToSection(sectionId: string): void {
    const element = document.querySelector(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

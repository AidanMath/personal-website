import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  socialLinks = [
    { icon: 'fab fa-github', url: 'https://github.com/AidanMath', label: 'GitHub' },
    { icon: 'fab fa-linkedin', url: 'https://linkedin.com/in/', label: 'LinkedIn' },
    { icon: 'fab fa-twitter', url: 'https://twitter.com/', label: 'Twitter' }
  ];

  quickLinks = [
    { label: 'About', href: '#about' },
    { label: 'Projects', href: '#projects' },
    { label: 'Hobbies', href: '#hobbies' },
    { label: 'Contact', href: '#contact' }
  ];

  scrollToSection(event: Event, href: string): void {
    event.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

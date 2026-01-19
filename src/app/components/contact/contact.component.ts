import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact',
  imports: [CommonModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent {
  contactMethods = [
    {
      icon: 'fas fa-envelope',
      title: 'Email',
      value: 'hello@example.com',
      link: 'mailto:hello@example.com'
    },
    {
      icon: 'fab fa-github',
      title: 'GitHub',
      value: 'AidanMath',
      link: 'https://github.com/AidanMath'
    },
    {
      icon: 'fab fa-linkedin',
      title: 'LinkedIn',
      value: 'Connect with me',
      link: 'https://linkedin.com/in/'
    }
  ];
}

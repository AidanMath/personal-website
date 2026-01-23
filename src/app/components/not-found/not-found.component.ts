import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SandBackgroundComponent } from '../sand-background/sand-background.component';

@Component({
  selector: 'app-not-found',
  imports: [CommonModule, RouterLink, SandBackgroundComponent],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss'
})
export class NotFoundComponent {}

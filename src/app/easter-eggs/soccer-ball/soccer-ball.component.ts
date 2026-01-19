import { Component, OnInit, OnDestroy, HostListener, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-soccer-ball',
  imports: [CommonModule],
  templateUrl: './soccer-ball.component.html',
  styleUrl: './soccer-ball.component.scss'
})
export class SoccerBallComponent implements OnInit, OnDestroy {
  @Input() isActive = false;

  x = 100;
  y = 100;
  vx = 2;
  vy = 2;
  rotation = 0;

  private animationId: number | null = null;
  private gravity = 0.3;
  private friction = 0.99;
  private bounce = 0.7;
  private ballSize = 50;

  ngOnInit(): void {
    if (this.isActive) {
      this.startAnimation();
    }
  }

  ngOnDestroy(): void {
    this.stopAnimation();
  }

  private startAnimation(): void {
    const animate = () => {
      this.updatePosition();
      this.animationId = requestAnimationFrame(animate);
    };
    this.animationId = requestAnimationFrame(animate);
  }

  private stopAnimation(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private updatePosition(): void {
    // Apply gravity
    this.vy += this.gravity;

    // Apply friction
    this.vx *= this.friction;
    this.vy *= this.friction;

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Update rotation based on horizontal velocity
    this.rotation += this.vx * 2;

    // Bounce off walls
    const maxX = window.innerWidth - this.ballSize;
    const maxY = window.innerHeight - this.ballSize;

    if (this.x <= 0) {
      this.x = 0;
      this.vx *= -this.bounce;
    } else if (this.x >= maxX) {
      this.x = maxX;
      this.vx *= -this.bounce;
    }

    if (this.y <= 0) {
      this.y = 0;
      this.vy *= -this.bounce;
    } else if (this.y >= maxY) {
      this.y = maxY;
      this.vy *= -this.bounce;
    }
  }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent): void {
    if (!this.isActive) return;

    const dx = event.clientX - (this.x + this.ballSize / 2);
    const dy = event.clientY - (this.y + this.ballSize / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Only kick if clicked near the ball (within 100px)
    if (distance < 100) {
      // Kick away from click point
      const power = Math.max(15, 30 - distance / 5);
      this.vx = -dx / distance * power;
      this.vy = -dy / distance * power;
    }
  }
}

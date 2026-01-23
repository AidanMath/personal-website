import { Component, EventEmitter, Output, ElementRef, ViewChild, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

interface SandParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
}

@Component({
  selector: 'app-soccer-game',
  imports: [CommonModule],
  templateUrl: './soccer-game.component.html',
  styleUrl: './soccer-game.component.scss'
})
export class SoccerGameComponent implements AfterViewInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  @ViewChild('gameCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  // Game state
  score = 0;
  highScore = 0;
  isPlaying = false;
  gameOver = false;

  // Ball physics
  private ball = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 30,
    rotation: 0,
    rotationSpeed: 0
  };

  // Physics constants
  private readonly GRAVITY = 0.4;
  private readonly KICK_FORCE = -12;
  private readonly BOUNCE_DAMPING = 0.7;
  private readonly AIR_RESISTANCE = 0.99;
  private readonly ROTATION_FACTOR = 0.03;

  // Canvas
  private ctx!: CanvasRenderingContext2D;
  private animationId: number = 0;
  private canvasWidth = 400;
  private canvasHeight = 500;

  // Sand particles
  private sandParticles: SandParticle[] = [];

  // Ball image
  private ballPattern: CanvasPattern | null = null;

  constructor() {
    this.loadHighScore();
  }

  ngAfterViewInit(): void {
    this.initCanvas();
    this.resetBall();
    this.startGame();
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private initCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    this.canvasWidth = rect.width;
    this.canvasHeight = rect.height;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    this.ctx.scale(dpr, dpr);
  }

  private resetBall(): void {
    this.ball.x = this.canvasWidth / 2;
    this.ball.y = this.canvasHeight / 3;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.rotation = 0;
    this.ball.rotationSpeed = 0;
  }

  private startGame(): void {
    this.isPlaying = true;
    this.gameOver = false;
    this.score = 0;
    this.resetBall();
    this.gameLoop();
  }

  private gameLoop = (): void => {
    this.update();
    this.render();

    if (this.isPlaying) {
      this.animationId = requestAnimationFrame(this.gameLoop);
    }
  };

  private update(): void {
    if (this.gameOver) return;

    // Apply gravity
    this.ball.vy += this.GRAVITY;

    // Apply air resistance
    this.ball.vx *= this.AIR_RESISTANCE;
    this.ball.vy *= this.AIR_RESISTANCE;

    // Update position
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    // Update rotation based on horizontal velocity
    this.ball.rotationSpeed = this.ball.vx * this.ROTATION_FACTOR;
    this.ball.rotation += this.ball.rotationSpeed;

    // Wall collisions
    if (this.ball.x - this.ball.radius < 0) {
      this.ball.x = this.ball.radius;
      this.ball.vx = -this.ball.vx * this.BOUNCE_DAMPING;
    } else if (this.ball.x + this.ball.radius > this.canvasWidth) {
      this.ball.x = this.canvasWidth - this.ball.radius;
      this.ball.vx = -this.ball.vx * this.BOUNCE_DAMPING;
    }

    // Ceiling collision
    if (this.ball.y - this.ball.radius < 0) {
      this.ball.y = this.ball.radius;
      this.ball.vy = -this.ball.vy * this.BOUNCE_DAMPING;
    }

    // Floor collision - game over
    if (this.ball.y + this.ball.radius > this.canvasHeight) {
      this.ball.y = this.canvasHeight - this.ball.radius;
      this.ball.vy = -this.ball.vy * this.BOUNCE_DAMPING;

      // Check if ball is essentially stopped at the bottom
      if (Math.abs(this.ball.vy) < 1) {
        this.endGame();
      }
    }

    // Update sand particles
    this.updateSandParticles();
  }

  private updateSandParticles(): void {
    for (let i = this.sandParticles.length - 1; i >= 0; i--) {
      const p = this.sandParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2; // Gravity for particles
      p.life -= 0.02;
      p.alpha = p.life;

      if (p.life <= 0) {
        this.sandParticles.splice(i, 1);
      }
    }
  }

  private spawnSandParticles(x: number, y: number): void {
    const particleCount = 15 + Math.floor(Math.random() * 10);

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;

      this.sandParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: 2 + Math.random() * 4,
        alpha: 1,
        life: 0.5 + Math.random() * 0.5
      });
    }
  }

  private render(): void {
    // Clear canvas with gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
    gradient.addColorStop(0, '#2d2522');
    gradient.addColorStop(1, '#1a1714');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Draw ground line (desert sand)
    const groundGradient = this.ctx.createLinearGradient(0, this.canvasHeight - 30, 0, this.canvasHeight);
    groundGradient.addColorStop(0, 'rgba(212, 133, 74, 0.3)');
    groundGradient.addColorStop(1, 'rgba(212, 133, 74, 0.1)');
    this.ctx.fillStyle = groundGradient;
    this.ctx.fillRect(0, this.canvasHeight - 30, this.canvasWidth, 30);

    // Draw sand particles
    this.renderSandParticles();

    // Draw ball
    this.renderBall();

    // Draw score
    this.renderScore();

    // Draw game over overlay
    if (this.gameOver) {
      this.renderGameOver();
    }
  }

  private renderSandParticles(): void {
    for (const p of this.sandParticles) {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(212, 133, 74, ${p.alpha * 0.8})`;
      this.ctx.fill();
    }
  }

  private renderBall(): void {
    this.ctx.save();
    this.ctx.translate(this.ball.x, this.ball.y);
    this.ctx.rotate(this.ball.rotation);

    // Ball gradient (3D effect)
    const ballGradient = this.ctx.createRadialGradient(
      -this.ball.radius * 0.3, -this.ball.radius * 0.3, 0,
      0, 0, this.ball.radius
    );
    ballGradient.addColorStop(0, '#ffffff');
    ballGradient.addColorStop(0.3, '#f0f0f0');
    ballGradient.addColorStop(0.7, '#d0d0d0');
    ballGradient.addColorStop(1, '#909090');

    // Main ball
    this.ctx.beginPath();
    this.ctx.arc(0, 0, this.ball.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = ballGradient;
    this.ctx.fill();

    // Soccer ball pattern (pentagons)
    this.ctx.fillStyle = '#1a1714';
    this.drawPentagonPattern();

    // Ball outline
    this.ctx.beginPath();
    this.ctx.arc(0, 0, this.ball.radius, 0, Math.PI * 2);
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.restore();

    // Shadow
    this.ctx.beginPath();
    const shadowY = this.canvasHeight - 10;
    const shadowScale = 1 - (shadowY - this.ball.y) / this.canvasHeight * 0.5;
    this.ctx.ellipse(
      this.ball.x,
      shadowY,
      this.ball.radius * 0.8 * shadowScale,
      this.ball.radius * 0.2 * shadowScale,
      0, 0, Math.PI * 2
    );
    this.ctx.fillStyle = `rgba(0, 0, 0, ${0.3 * shadowScale})`;
    this.ctx.fill();
  }

  private drawPentagonPattern(): void {
    const r = this.ball.radius;

    // Draw simplified pentagon pattern
    const pentagons = [
      { x: 0, y: 0, scale: 0.35 },
      { x: 0, y: -r * 0.7, scale: 0.25 },
      { x: r * 0.65, y: -r * 0.25, scale: 0.25 },
      { x: r * 0.4, y: r * 0.55, scale: 0.25 },
      { x: -r * 0.4, y: r * 0.55, scale: 0.25 },
      { x: -r * 0.65, y: -r * 0.25, scale: 0.25 }
    ];

    for (const p of pentagons) {
      this.drawPentagon(p.x, p.y, r * p.scale);
    }
  }

  private drawPentagon(cx: number, cy: number, size: number): void {
    this.ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
      const x = cx + Math.cos(angle) * size;
      const y = cy + Math.sin(angle) * size;
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.closePath();
    this.ctx.fill();
  }

  private renderScore(): void {
    // Score background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this.ctx.roundRect(this.canvasWidth / 2 - 60, 15, 120, 45, 10);
    this.ctx.fill();

    // Score text
    this.ctx.fillStyle = '#f5efe6';
    this.ctx.font = 'bold 28px system-ui, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.score.toString(), this.canvasWidth / 2, 38);
  }

  private renderGameOver(): void {
    // Overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Game over text
    this.ctx.fillStyle = '#f5efe6';
    this.ctx.font = 'bold 32px system-ui, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Game Over!', this.canvasWidth / 2, this.canvasHeight / 2 - 60);

    // Final score
    this.ctx.font = '24px system-ui, sans-serif';
    this.ctx.fillText(`Score: ${this.score}`, this.canvasWidth / 2, this.canvasHeight / 2 - 15);

    // High score
    this.ctx.fillStyle = '#d4854a';
    this.ctx.font = '20px system-ui, sans-serif';
    this.ctx.fillText(`Best: ${this.highScore}`, this.canvasWidth / 2, this.canvasHeight / 2 + 20);

    // Tap to restart
    this.ctx.fillStyle = 'rgba(245, 239, 230, 0.7)';
    this.ctx.font = '16px system-ui, sans-serif';
    this.ctx.fillText('Tap or click to play again', this.canvasWidth / 2, this.canvasHeight / 2 + 70);
  }

  private endGame(): void {
    this.gameOver = true;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
    }
  }

  private loadHighScore(): void {
    const saved = localStorage.getItem('keepieUppieHighScore');
    this.highScore = saved ? parseInt(saved, 10) : 0;
  }

  private saveHighScore(): void {
    localStorage.setItem('keepieUppieHighScore', this.highScore.toString());
  }

  // Click/tap handler
  onCanvasClick(event: MouseEvent | TouchEvent): void {
    event.preventDefault();

    if (this.gameOver) {
      this.startGame();
      return;
    }

    // Get click position
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    let clientX: number, clientY: number;

    if (event instanceof MouseEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    }

    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    // Check if click is near the ball (within a generous radius)
    const dx = clickX - this.ball.x;
    const dy = clickY - this.ball.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Allow kicks within 2x ball radius
    if (distance < this.ball.radius * 2.5) {
      this.kickBall(clickX, clickY);
    }
  }

  private kickBall(kickX: number, kickY: number): void {
    // Calculate kick direction (away from click point, upward bias)
    const dx = this.ball.x - kickX;
    const dy = this.ball.y - kickY;

    // Normalize and apply force
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const horizontalForce = (dx / dist) * 4;

    this.ball.vy = this.KICK_FORCE;
    this.ball.vx += horizontalForce;

    // Spawn sand particles at kick point
    this.spawnSandParticles(this.ball.x, this.ball.y + this.ball.radius);

    // Increment score
    this.score++;
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.onClose();
    } else if (event.key === ' ' || event.key === 'Enter') {
      if (this.gameOver) {
        this.startGame();
      }
    }
  }

  onClose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.close.emit();
  }

  restartGame(): void {
    this.startGame();
  }
}

import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SandBackgroundComponent } from './components/sand-background/sand-background.component';
import { TravelComponent } from './components/travel/travel.component';
import { ChessPuzzleComponent } from './easter-eggs/chess-puzzle/chess-puzzle.component';
import { SoccerGameComponent } from './easter-eggs/soccer-game/soccer-game.component';

interface Project {
  title: string;
  description: string;
  tags: string[];
  github?: string;
  demo?: string;
}

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    SandBackgroundComponent,
    TravelComponent,
    ChessPuzzleComponent,
    SoccerGameComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  // Modal states
  showChessPuzzle = false;
  showSoccerGame = false;

  // Parallax state
  parallaxY = 0;
  private ticking = false;
  private lastScrollY = 0;

  openChessPuzzle(): void {
    this.showChessPuzzle = true;
  }

  closeChessPuzzle(): void {
    this.showChessPuzzle = false;
  }

  openSoccerGame(): void {
    this.showSoccerGame = true;
  }

  closeSoccerGame(): void {
    this.showSoccerGame = false;
  }

  ngOnInit(): void {
    // Initial parallax calculation
    this.updateParallax();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(): void {
    this.lastScrollY = window.scrollY;

    if (!this.ticking) {
      requestAnimationFrame(() => {
        this.updateParallax();
        this.ticking = false;
      });
      this.ticking = true;
    }
  }

  private updateParallax(): void {
    const scrollY = this.lastScrollY;
    const viewportHeight = window.innerHeight;

    // Update CSS custom property for parallax effects
    this.parallaxY = scrollY;

    // Set CSS custom properties on document root for use in SCSS
    document.documentElement.style.setProperty('--scroll-y', `${scrollY}px`);
    document.documentElement.style.setProperty('--parallax-hero', `${scrollY * 0.5}px`);
    document.documentElement.style.setProperty('--parallax-slow', `${scrollY * 0.3}px`);
    document.documentElement.style.setProperty('--parallax-medium', `${scrollY * 0.15}px`);
  }

  // Helper to get parallax transform for elements
  getParallaxStyle(speed: number = 0.5): { [key: string]: string } {
    return {
      transform: `translateY(${this.parallaxY * speed}px)`
    };
  }

  projects: Project[] = [
    {
      title: 'Sand Simulation',
      description: 'Interactive falling sand with WebGL 2.0 rendering and realistic physics. The hero of this site is a live demo.',
      tags: ['WebGL', 'TypeScript', 'Angular'],
      github: 'https://github.com/AidanMath/personal-website'
    },
    {
      title: 'Data Structures Visualizer',
      description: 'Educational tool demonstrating how algorithms traverse, affect, and manipulate basic data structures.',
      tags: ['Python', 'Visualization', 'Algorithms'],
      github: 'https://github.com/AidanMath/Data-Structures-Visualizer'
    },
    {
      title: 'Soccer Stat Tracker',
      description: 'Track and analyze soccer statistics across the top 5 professional leagues using the API-Football service.',
      tags: ['Python', 'TKinter', 'REST API'],
      github: 'https://github.com/AidanMath/SoccerStatTracker'
    },
    {
      title: 'Password Manager',
      description: 'GUI application for generating passwords and securely storing them in an encrypted text file.',
      tags: ['Python', 'TKinter', 'Encryption'],
      github: 'https://github.com/AidanMath/Password-Managment-Gui'
    },
    {
      title: 'Game of Life',
      description: "Conway's Game of Life implementation with an Angular frontend and Spring Boot backend.",
      tags: ['Angular', 'Spring Boot', 'Java'],
      github: 'https://github.com/AidanMath/GameOfLife'
    },
    {
      title: 'Planet Simulation',
      description: 'Planetary orbit simulation with Spotify integration for a unique audio-visual experience.',
      tags: ['Python', 'Physics', 'Spotify API'],
      github: 'https://github.com/AidanMath/Planet-Simulation-with-Spotify'
    },
    {
      title: 'Interpreter & Compiler',
      description: 'Building an interpreter and compiler from scratch, following Crafting Interpreters.',
      tags: ['Java', 'Compilers', 'Language Design'],
      github: 'https://github.com/AidanMath/Interpreter-compiler'
    },
    {
      title: 'Console Web Search',
      description: 'Command-line tool for performing web searches directly from the terminal.',
      tags: ['CLI', 'Web Scraping'],
      github: 'https://github.com/AidanMath/Console-Web-Search'
    },
    {
      title: 'Sand Pixel Art',
      description: 'Transform any image into interactive falling sand pixel art.',
      tags: ['TypeScript', 'Canvas', 'Image Processing'],
      github: 'https://github.com/AidanMath/sand-pixel'
    }
  ];
}

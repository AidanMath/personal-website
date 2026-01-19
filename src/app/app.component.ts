import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HeroComponent } from './components/hero/hero.component';
import { AboutComponent } from './components/about/about.component';
import { ProjectsComponent } from './components/projects/projects.component';
import { HobbiesComponent } from './components/hobbies/hobbies.component';
import { ContactComponent } from './components/contact/contact.component';
import { FooterComponent } from './components/footer/footer.component';
import { ChessPuzzleComponent } from './easter-eggs/chess-puzzle/chess-puzzle.component';
import { SoccerBallComponent } from './easter-eggs/soccer-ball/soccer-ball.component';
import { KonamiSecretComponent } from './easter-eggs/konami-secret/konami-secret.component';
import { KonamiService } from './services/konami.service';

@Component({
  selector: 'app-root',
  imports: [
    NavbarComponent,
    HeroComponent,
    AboutComponent,
    ProjectsComponent,
    HobbiesComponent,
    ContactComponent,
    FooterComponent,
    ChessPuzzleComponent,
    SoccerBallComponent,
    KonamiSecretComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'aidan-portfolio';

  showChessPuzzle = false;
  showSoccerBall = false;
  showKonamiSecret = false;

  private konamiSubscription?: Subscription;

  constructor(private konamiService: KonamiService) {}

  ngOnInit(): void {
    this.konamiSubscription = this.konamiService.konamiActivated$.subscribe(() => {
      this.showKonamiSecret = true;
    });
  }

  ngOnDestroy(): void {
    this.konamiSubscription?.unsubscribe();
  }

  openChessPuzzle(): void {
    this.showChessPuzzle = true;
  }

  closeChessPuzzle(): void {
    this.showChessPuzzle = false;
  }

  activateSoccerBall(): void {
    this.showSoccerBall = !this.showSoccerBall;
  }

  closeKonamiSecret(): void {
    this.showKonamiSecret = false;
  }
}

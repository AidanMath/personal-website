import { Component } from '@angular/core';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HeroComponent } from './components/hero/hero.component';
import { AboutComponent } from './components/about/about.component';
import { ProjectsComponent } from './components/projects/projects.component';
import { HobbiesComponent } from './components/hobbies/hobbies.component';
import { ContactComponent } from './components/contact/contact.component';
import { FooterComponent } from './components/footer/footer.component';
import { SandBackgroundComponent } from './components/sand-background/sand-background.component';
import { ChessPuzzleComponent } from './easter-eggs/chess-puzzle/chess-puzzle.component';

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
    SandBackgroundComponent,
    ChessPuzzleComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'aidan-portfolio';
  showChessPuzzle = false;

  openChessPuzzle(): void {
    this.showChessPuzzle = true;
  }

  closeChessPuzzle(): void {
    this.showChessPuzzle = false;
  }
}

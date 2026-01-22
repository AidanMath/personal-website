import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have projects array', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.projects).toBeDefined();
    expect(Array.isArray(app.projects)).toBe(true);
    expect(app.projects.length).toBeGreaterThan(0);
  });

  it('should have valid project structure', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    app.projects.forEach(project => {
      expect(project.title).toBeDefined();
      expect(project.description).toBeDefined();
      expect(project.tags).toBeDefined();
      expect(Array.isArray(project.tags)).toBe(true);
    });
  });
});

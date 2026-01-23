# Claude Context

## Project Overview
**Name:** Aidan's Portfolio Website
**Tech Stack:** Angular 19, TypeScript, SCSS, WebGL 2.0
**Location:** `/Users/aidan/Desktop/Projects/aidan-portfolio`

## What This Project Is
A personal portfolio website featuring an interactive falling sand simulation as the background. The sand uses WebGL for rendering and has realistic physics with mouse interaction.

## Current Design Theme: Desert Dusk
- **Background:** Warm charcoal (`#1a1714`) with animated gradient
- **Cards:** Glassmorphism style with blur, shine overlay, warm borders
- **Accent Color:** Burnt orange (`#d4854a`) / Golden sand (`#e9a85c`)
- **Text:** Warm white (`#f5efe6`) / Sand gray (`#a89a8a`)

## Key Features Implemented
1. **Sand Simulation Background** - WebGL 2.0 falling sand with mouse interaction
2. **Fade-in Loading** - Sand canvas fades in smoothly on load
3. **Tab Visibility** - Animation pauses when tab is hidden (saves CPU)
4. **Mobile Optimization** - Reduced grain count on smaller screens
5. **Parallax Effect** - Sand moves slower than content on scroll
6. **Scroll Animations** - Sections fade up when entering viewport
7. **Sound Effects** - Subtle sand sounds on interaction (with mute toggle)
8. **404 Page** - Custom not-found page with sand background
9. **Floating Dust Particles** - 8 animated particles floating upward
10. **Animated Gradient Background** - Slow breathing warmth effect

## Project Structure
```
src/
├── app/
│   ├── app.component.ts/html/scss    # Main layout, projects data
│   ├── app.routes.ts                  # Routes including 404
│   └── components/
│       ├── sand-background/           # WebGL sand simulation
│       │   ├── models/                # SandGrain, SandGrid
│       │   ├── services/              # Physics, mouse, colors
│       │   └── webgl/                 # Shaders, renderer
│       ├── not-found/                 # 404 page
│       └── hobbies/                   # Hobby cards (if used)
├── styles.scss                        # Global styles, theme
└── assets/
```

## Current Pages/Sections
1. **Profile Card** - Name, title, bio, social links
2. **About Me Card** - Personal intro, hobbies (Chess, Soccer, Music, Gaming)
3. **Projects Carousel** - Horizontal scroll, 3 visible at a time

## Projects Listed
1. Sand Simulation (this site)
2. Data Structures Visualizer
3. Soccer Stat Tracker
4. Password Manager
5. Game of Life
6. Planet Simulation with Spotify
7. Interpreter & Compiler
8. Console Web Search
9. Sand Pixel Art

GitHub: https://github.com/AidanMath

## Recent Session Work (Latest First)

### Session: January 2025
- Added animated gradient background with slow hue shift
- Added 8 floating dust particles with staggered animations
- Implemented Desert Dusk color theme (warm earthy tones)
- Added glassmorphism card design with blur, shine, shadows
- Made projects horizontally scrollable (3 visible at a time)
- Added About Me card with hobbies section
- Connected real GitHub projects to portfolio
- Removed visual ripple effect, improved sound to white noise
- Implemented all 9 portfolio enhancements from plan

## Placeholders to Update
- `your.email@example.com` - Update with real email
- LinkedIn URL - Update with real profile

## Build Commands
```bash
npm run build    # Production build
npm start        # Dev server at localhost:4200
```

## Notes
- SCSS budget warning is expected (file is ~7KB, budget is 4KB) - not a blocker
- Sound is muted by default, preference stored in localStorage
- Sand grain count adapts: 3px desktop, 4px tablet, 5px mobile

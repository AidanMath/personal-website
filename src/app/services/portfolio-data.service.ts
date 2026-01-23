import { Injectable } from '@angular/core';
import { Project, Place } from '../models';

/**
 * Service providing portfolio data (projects, places, etc.)
 * Centralizes data management and provides a single source of truth.
 * Future enhancement: Could fetch from API instead of static data.
 */
@Injectable({
  providedIn: 'root'
})
export class PortfolioDataService {

  /**
   * Get all portfolio projects
   */
  getProjects(): Project[] {
    return PROJECTS_DATA;
  }

  /**
   * Get featured projects only
   */
  getFeaturedProjects(): Project[] {
    return PROJECTS_DATA.filter(p => p.featured);
  }

  /**
   * Get all travel places
   */
  getPlaces(): Place[] {
    return PLACES_DATA;
  }

  /**
   * Get visited places
   */
  getVisitedPlaces(): Place[] {
    return PLACES_DATA.filter(p => p.visited);
  }

  /**
   * Get bucket list places
   */
  getBucketListPlaces(): Place[] {
    return PLACES_DATA.filter(p => !p.visited);
  }
}

// ===========================================
// Static Data
// ===========================================

const PROJECTS_DATA: Project[] = [
  {
    id: 'sand-simulation',
    title: 'Interactive Sand Simulation',
    description: 'A WebGL-powered particle physics simulation that renders images as interactive falling sand. Features support-based stability for creating tunnels and cliffs.',
    tags: ['WebGL', 'TypeScript', 'Physics'],
    featured: true
  },
  {
    id: 'chess-puzzles',
    title: 'Chess Puzzle Trainer',
    description: 'Practice tactical chess puzzles with instant feedback. Features drag-and-drop pieces and computer opponent responses.',
    tags: ['Angular', 'TypeScript', 'Canvas'],
    github: 'https://github.com/AidanMath'
  },
  {
    id: 'soccer-game',
    title: 'Keepie-Uppie Game',
    description: 'A physics-based soccer juggling game. Keep the ball in the air as long as possible with realistic ball physics.',
    tags: ['Canvas', 'Physics', 'Game Dev']
  },
  {
    id: 'portfolio',
    title: 'Portfolio Website',
    description: 'This very website! Built with Angular featuring custom animations, interactive elements, and responsive design.',
    tags: ['Angular', 'SCSS', 'TypeScript'],
    github: 'https://github.com/AidanMath'
  },
  {
    id: 'data-viz',
    title: 'Data Visualization Dashboard',
    description: 'Interactive dashboards for exploring complex datasets with filtering, sorting, and real-time updates.',
    tags: ['D3.js', 'TypeScript', 'REST API']
  }
];

const PLACES_DATA: Place[] = [
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    countryCode: 'JP',
    imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
    description: 'Exploring the perfect blend of ancient temples and cutting-edge technology.',
    visited: true
  },
  {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    countryCode: 'FR',
    imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400',
    description: 'The city of lights, art, and incredible cuisine.',
    visited: true
  },
  {
    id: 'new-york',
    name: 'New York',
    country: 'United States',
    countryCode: 'US',
    imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400',
    description: 'The city that never sleeps - endless energy and possibilities.',
    visited: true
  },
  {
    id: 'barcelona',
    name: 'Barcelona',
    country: 'Spain',
    countryCode: 'ES',
    imageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400',
    description: 'Gaudi architecture, Mediterranean vibes, and amazing food.',
    visited: true
  },
  {
    id: 'iceland',
    name: 'Reykjavik',
    country: 'Iceland',
    countryCode: 'IS',
    imageUrl: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=400',
    description: 'Northern lights, geysers, and otherworldly landscapes.',
    visited: false
  },
  {
    id: 'new-zealand',
    name: 'Queenstown',
    country: 'New Zealand',
    countryCode: 'NZ',
    imageUrl: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=400',
    description: 'Adventure capital with stunning mountains and lakes.',
    visited: false
  },
  {
    id: 'switzerland',
    name: 'Swiss Alps',
    country: 'Switzerland',
    countryCode: 'CH',
    imageUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400',
    description: 'Majestic peaks, pristine lakes, and charming villages.',
    visited: false
  },
  {
    id: 'norway',
    name: 'Norwegian Fjords',
    country: 'Norway',
    countryCode: 'NO',
    imageUrl: 'https://images.unsplash.com/photo-1520769945061-0a448c463865?w=400',
    description: 'Dramatic fjords and midnight sun adventures.',
    visited: false
  }
];

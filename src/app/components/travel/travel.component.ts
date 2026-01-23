import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Place {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  imageUrl: string;
  description: string;
  visited: boolean;
}

@Component({
  selector: 'app-travel',
  imports: [CommonModule],
  templateUrl: './travel.component.html',
  styleUrl: './travel.component.scss'
})
export class TravelComponent {
  activeFilter: 'all' | 'visited' | 'bucket-list' = 'all';

  // Sample places - replace with your own!
  places: Place[] = [
    {
      id: '1',
      name: 'Tokyo',
      country: 'Japan',
      countryCode: 'JP',
      imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
      description: 'Neon lights, ancient temples, and the best ramen',
      visited: true
    },
    {
      id: '2',
      name: 'Barcelona',
      country: 'Spain',
      countryCode: 'ES',
      imageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80',
      description: 'Gaudí architecture and Mediterranean vibes',
      visited: true
    },
    {
      id: '3',
      name: 'Reykjavik',
      country: 'Iceland',
      countryCode: 'IS',
      imageUrl: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800&q=80',
      description: 'Northern lights and otherworldly landscapes',
      visited: false
    },
    {
      id: '4',
      name: 'New York City',
      country: 'USA',
      countryCode: 'US',
      imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80',
      description: 'The city that never sleeps',
      visited: true
    },
    {
      id: '5',
      name: 'Kyoto',
      country: 'Japan',
      countryCode: 'JP',
      imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
      description: 'Traditional gardens and serene temples',
      visited: true
    },
    {
      id: '6',
      name: 'Patagonia',
      country: 'Argentina',
      countryCode: 'AR',
      imageUrl: 'https://images.unsplash.com/photo-1531761535209-180857e963b9?w=800&q=80',
      description: 'Glaciers and dramatic mountain peaks',
      visited: false
    },
    {
      id: '7',
      name: 'Amsterdam',
      country: 'Netherlands',
      countryCode: 'NL',
      imageUrl: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=80',
      description: 'Canals, bikes, and world-class museums',
      visited: true
    },
    {
      id: '8',
      name: 'New Zealand',
      country: 'New Zealand',
      countryCode: 'NZ',
      imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80',
      description: 'Middle-earth landscapes and adventure sports',
      visited: false
    }
  ];

  // Country code to flag emoji mapping
  private flagEmojis: { [key: string]: string } = {
    JP: '🇯🇵',
    ES: '🇪🇸',
    IS: '🇮🇸',
    US: '🇺🇸',
    AR: '🇦🇷',
    NL: '🇳🇱',
    NZ: '🇳🇿',
    FR: '🇫🇷',
    IT: '🇮🇹',
    GB: '🇬🇧',
    DE: '🇩🇪',
    AU: '🇦🇺',
    CA: '🇨🇦',
    BR: '🇧🇷',
    MX: '🇲🇽',
    TH: '🇹🇭',
    VN: '🇻🇳',
    GR: '🇬🇷',
    PT: '🇵🇹',
    CH: '🇨🇭'
  };

  get filteredPlaces(): Place[] {
    switch (this.activeFilter) {
      case 'visited':
        return this.places.filter(p => p.visited);
      case 'bucket-list':
        return this.places.filter(p => !p.visited);
      default:
        return this.places;
    }
  }

  get visitedCount(): number {
    return this.places.filter(p => p.visited).length;
  }

  get bucketListCount(): number {
    return this.places.filter(p => !p.visited).length;
  }

  getFlagEmoji(countryCode: string): string {
    return this.flagEmojis[countryCode] || '🏳️';
  }

  setFilter(filter: 'all' | 'visited' | 'bucket-list'): void {
    this.activeFilter = filter;
  }
}

/**
 * Represents a travel destination
 */
export interface Place {
  readonly id: string;
  readonly name: string;
  readonly country: string;
  readonly countryCode: string;
  readonly imageUrl: string;
  readonly description: string;
  readonly visited: boolean;
}

/**
 * Filter options for travel places
 */
export type PlaceFilter = 'all' | 'visited' | 'bucketList';

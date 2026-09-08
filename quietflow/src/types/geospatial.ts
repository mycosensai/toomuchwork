// ─── Geospatial & POI Types ──────────────────────────────────

// Expanded categories matching Google Maps / Waze coverage
export type POICategory =
  | 'grocery'
  | 'pharmacy'
  | 'coffee'
  | 'restaurant'
  | 'fast_food'
  | 'gas_station'
  | 'bank'
  | 'post_office'
  | 'library'
  | 'park'
  | 'retail'
  | 'hospital'
  | 'school'
  | 'hotel'
  | 'gym'
  | 'laundromat'
  | 'bar'
  | 'convenience'
  | 'hardware'
  | 'car_wash'
  | 'parking'
  | 'atm'
  | 'transit'
  | 'police'
  | 'fire_station'
  | 'place_of_worship'
  | 'other';

export const POI_CATEGORIES: POICategory[] = [
  'grocery', 'pharmacy', 'coffee', 'restaurant', 'fast_food',
  'gas_station', 'bank', 'post_office', 'library', 'park',
  'retail', 'hospital', 'school', 'hotel', 'gym',
  'laundromat', 'bar', 'convenience', 'hardware', 'car_wash',
  'parking', 'atm', 'transit', 'police', 'fire_station',
  'place_of_worship', 'other',
];

export const CATEGORY_ICONS: Record<POICategory, string> = {
  grocery: '🛒',
  pharmacy: '💊',
  coffee: '☕',
  restaurant: '🍽️',
  fast_food: '🍔',
  gas_station: '⛽',
  bank: '🏦',
  post_office: '📬',
  library: '📚',
  park: '🌳',
  retail: '🛍️',
  hospital: '🏥',
  school: '🏫',
  hotel: '🏨',
  gym: '💪',
  laundromat: '🧺',
  bar: '🍺',
  convenience: '🏪',
  hardware: '🔧',
  car_wash: '🧼',
  parking: '🅿️',
  atm: '💳',
  transit: '🚇',
  police: '👮',
  fire_station: '🚒',
  place_of_worship: '⛪',
  other: '📍',
};

export const CATEGORY_LABELS: Record<POICategory, string> = {
  grocery: 'Grocery',
  pharmacy: 'Pharmacy',
  coffee: 'Coffee',
  restaurant: 'Restaurant',
  fast_food: 'Fast Food',
  gas_station: 'Gas Station',
  bank: 'Bank',
  post_office: 'Post Office',
  library: 'Library',
  park: 'Park',
  retail: 'Retail',
  hospital: 'Hospital',
  school: 'School',
  hotel: 'Hotel',
  gym: 'Gym',
  laundromat: 'Laundromat',
  bar: 'Bar / Nightlife',
  convenience: 'Convenience Store',
  hardware: 'Hardware',
  car_wash: 'Car Wash',
  parking: 'Parking',
  atm: 'ATM',
  transit: 'Transit',
  police: 'Police',
  fire_station: 'Fire Station',
  place_of_worship: 'Place of Worship',
  other: 'Other',
};

export const CATEGORY_GROUPS: Record<string, POICategory[]> = {
  'Food & Drink': ['grocery', 'coffee', 'restaurant', 'fast_food', 'bar', 'convenience'],
  'Services': ['pharmacy', 'bank', 'post_office', 'hospital', 'gym', 'laundromat', 'car_wash', 'hardware'],
  'Shopping': ['retail', 'gas_station'],
  'Transport': ['gas_station', 'parking', 'atm', 'transit'],
  'Community': ['library', 'park', 'school', 'police', 'fire_station', 'place_of_worship'],
  'Accommodation': ['hotel'],
  'Other': ['other'],
};

export interface NearbyResult {
  locationId: string;
  name: string;
  category: POICategory;
  lat: number;
  lng: number;
  distance: number; // meters from query point
  densityLevel?: string;
  isOpen?: boolean;
  rating?: number;
  priceLevel?: 1 | 2 | 3;
  crowdLevel?: 'quiet' | 'moderate' | 'busy' | 'very_busy';
}

export interface ExploreQuery {
  lat: number;
  lng: number;
  radius: number; // meters
  categories?: POICategory[];
  maxResults?: number;
}

// ─── Business Location (extended) ──────────────────────────────

export interface BusinessPhoto {
  id: string;
  url: string;
  caption?: string;
  width: number;
  height: number;
}

export interface BusinessHours {
  monday?: { open: string; close: string };
  tuesday?: { open: string; close: string };
  wednesday?: { open: string; close: string };
  thursday?: { open: string; close: string };
  friday?: { open: string; close: string };
  saturday?: { open: string; close: string };
  sunday?: { open: string; close: string };
}

export interface DetailedBusinessInfo {
  description?: string;
  photos: BusinessPhoto[];
  hours: BusinessHours | null;
  phone: string;
  website: string;
  rating: number;
  reviewCount: number;
  priceLevel: 1 | 2 | 3 | 4;
  amenities: string[];
  tags: string[];
  popularity: 'quiet' | 'moderate' | 'popular' | 'very_popular';
}

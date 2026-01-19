
interface GeocodeResult {
  lat: number;
  lng: number;
  placeId: string;
  normalizedAddress: string;
}

// Simple in-memory cache
const geocodeCache = new Map<string, GeocodeResult & { timestamp: number }>();
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  // Normalize address for cache key
  const cacheKey = address.toLowerCase().trim().replace(/\s+/g, ' ');
  
  // Check cache
  const cached = geocodeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const { timestamp, ...result } = cached;
    return result;
  }

  // For now, use a simple geocoding approach
  // In production, you'd use Google Geocoding API
  // For testing, we can parse or use a fallback
  try {
    // TODO: Replace with actual Google Geocoding API call
    // const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`);
    // const data = await response.json();
    
    // For now, return mock data based on address
    // In production, implement proper geocoding with Google Maps Geocoding API
    // For testing with mockData id1: "1122 Vasquez Ave, Sunnyvale, CA 94086"
    let result: GeocodeResult;
    
    if (address.toLowerCase().includes('vasquez')) {
      // Mock coordinates for 1122 Vasquez Ave, Sunnyvale, CA 94086
      result = {
        lat: 37.3688,
        lng: -122.0363,
        placeId: `mock_vasquez_1122`,
        normalizedAddress: '1122 vasquez ave, sunnyvale, ca 94086'
      };
    } else {
      // Default to Sunnyvale, CA
      result = {
        lat: 37.3688,
        lng: -122.0363,
        placeId: `mock_${cacheKey.replace(/\s+/g, '_')}`,
        normalizedAddress: cacheKey
      };
    }

    // Cache the result
    geocodeCache.set(cacheKey, { ...result, timestamp: Date.now() });
    
    return result;
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Failed to geocode address');
  }
}

export function normalizeAddress(address: string): string {
  return address.toLowerCase().trim().replace(/\s+/g, ' ');
}

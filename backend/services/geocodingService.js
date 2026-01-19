
// Simple in-memory cache
const geocodeCache = new Map();
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

export async function geocodeAddress(address) {
  // Normalize address for cache key
  const cacheKey = address.toLowerCase().trim().replace(/\s+/g, ' ');
  
  // Check cache
  const cached = geocodeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const { timestamp, ...result } = cached;
    console.log(`[Geocoding] Using cached result for: ${address}`);
    return result;
  }

  // Try to use Google Geocoding API if available
  const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_GEOCODING_API_KEY;
  
  if (GOOGLE_API_KEY) {
    console.log(`[Geocoding] Google Maps API key found, calling Google Geocoding API for: ${address}`);
    try {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`;
      console.log(`[Geocoding] Making API request to: https://maps.googleapis.com/maps/api/geocode/json`);
      
      const response = await fetch(geocodeUrl);
      const data = await response.json();
      
      console.log(`[Geocoding] API Response status: ${data.status}`);
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        const result = {
          lat: location.lat,
          lng: location.lng,
          placeId: data.results[0].place_id,
          normalizedAddress: data.results[0].formatted_address.toLowerCase()
        };
        
        console.log(`[Geocoding] ✅ Successfully geocoded "${address}" to lat: ${location.lat}, lng: ${location.lng}`);
        console.log(`[Geocoding] Formatted address: ${data.results[0].formatted_address}`);
        
        // Cache the result
        geocodeCache.set(cacheKey, { ...result, timestamp: Date.now() });
        return result;
      } else {
        console.warn(`[Geocoding] ⚠️ Google API returned status: ${data.status}, message: ${data.error_message || 'No error message'}`);
        if (data.status === 'ZERO_RESULTS') {
          console.warn(`[Geocoding] No results found for address: ${address}`);
        }
        // Fall through to mock data
      }
    } catch (error) {
      console.error(`[Geocoding] ❌ Google Geocoding API error:`, error);
      console.error(`[Geocoding] Error details:`, error.message);
      // Fall through to mock data
    }
  } else {
    console.warn(`[Geocoding] ⚠️ No Google Maps API key found (GOOGLE_MAPS_API_KEY or GOOGLE_GEOCODING_API_KEY). Using mock data.`);
  }

  // Fallback to mock data based on address
  // For testing with mockData id1: "1122 Vasquez Ave, Sunnyvale, CA 94086"
  // These are approximate coordinates - should be replaced with actual geocoding
  console.log(`[Geocoding] ⚠️ Falling back to MOCK DATA for: ${address}`);
  let result;
  
  if (address.toLowerCase().includes('vasquez')) {
    // Approximate coordinates for 1122 Vasquez Ave, Sunnyvale, CA 94086
    // Note: These may need adjustment - using coordinates closer to actual Vasquez Ave
    result = {
      lat: 37.37608,
      lng: -122.05227,
      placeId: `mock_vasquez_1122`,
      normalizedAddress: '1122 vasquez ave, sunnyvale, ca 94086'
    };
    console.log(`[Geocoding] Using mock coordinates (lat: ${result.lat}, lng: ${result.lng}) for Vasquez address`);
  } else {
    // Default to Sunnyvale, CA
    result = {
      lat: 37.3688,
      lng: -122.0363,
      placeId: `mock_${cacheKey.replace(/\s+/g, '_')}`,
      normalizedAddress: cacheKey
    };
    console.log(`[Geocoding] Using default mock coordinates (lat: ${result.lat}, lng: ${result.lng})`);
  }

  // Cache the result
  geocodeCache.set(cacheKey, { ...result, timestamp: Date.now() });
  
  return result;
}

export function normalizeAddress(address) {
  return address.toLowerCase().trim().replace(/\s+/g, ' ');
}

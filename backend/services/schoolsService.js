// Google Places API for schools
const schoolsCache = new Map();
const CACHE_TTL = 90 * 24 * 60 * 60 * 1000; // 90 days

/**
 * Calculate distance between two coordinates in miles using Haversine formula
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get nearby schools using Google Places API
 */
export async function getNearbySchools(lat, lng, radiusMiles = 5) {
  const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)},${radiusMiles}`;
  const cached = schoolsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const { timestamp, ...result } = cached;
    return result;
  }

  const searchRadius = radiusMiles;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return {
      found: false,
      schools: [],
      count: 0,
      radiusMiles: searchRadius,
      error: "Google Maps API key not configured",
      message: "School data unavailable - Google Maps API key missing",
    };
  }

  try {
    // Convert radius from miles to meters (Google Places API uses meters)
    const radiusMeters = Math.round(radiusMiles * 1609.34);
    
    // Google Places Nearby Search API
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radiusMeters}&type=school&key=${apiKey}`;
    
    console.log("[Schools] Fetching schools from Google Places API...");
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Google Places API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status} - ${data.error_message || ''}`);
    }

    // Process results and calculate distances
    const places = data.results || [];
    const schools = places
      .map((place) => {
        const placeLat = place.geometry?.location?.lat;
        const placeLng = place.geometry?.location?.lng;
        
        if (!placeLat || !placeLng) return null;
        
        const distance = calculateDistance(lat, lng, placeLat, placeLng);
        
        return {
          name: place.name,
          address: place.vicinity || place.formatted_address,
          rating: place.rating || null,
          distance: Math.round(distance * 10) / 10, // Round to 1 decimal
          types: place.types || [],
        };
      })
      .filter(school => school !== null)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10); // Top 10 nearest

    const result = {
      found: schools.length > 0,
      schools: schools,
      count: schools.length,
      radiusMiles: searchRadius,
      message: schools.length > 0 
        ? `Found ${schools.length} school(s) within ${searchRadius} miles` 
        : `No schools found within ${searchRadius} miles`,
    };

    schoolsCache.set(cacheKey, { ...result, timestamp: Date.now() });
    return result;
  } catch (err) {
    console.error("[Schools] Google Places API error:", err.message);
    return {
      found: false,
      schools: [],
      count: 0,
      radiusMiles: searchRadius,
      error: String(err?.message || err),
      message: "School data unavailable",
    };
  }
}

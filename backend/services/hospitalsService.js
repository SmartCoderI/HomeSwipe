// Google Places API for hospitals
const hospitalsCache = new Map();
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
 * Get nearby hospitals using Google Places API
 */
export async function getNearbyHospitals(lat, lng, radiusMiles = 10) {
  const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)},${radiusMiles}`;
  const cached = hospitalsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const { timestamp, ...result } = cached;
    return result;
  }

  const searchRadius = radiusMiles;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return {
      found: false,
      hospitals: [],
      count: 0,
      radiusMiles: searchRadius,
      error: "Google Maps API key not configured",
      message: "Hospital data unavailable - Google Maps API key missing",
    };
  }

  try {
    // Convert radius from miles to meters (Google Places API uses meters)
    const radiusMeters = Math.round(radiusMiles * 1609.34);
    
    // Google Places Nearby Search API
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radiusMeters}&type=hospital&key=${apiKey}`;
    
    console.log("[Hospitals] Fetching hospitals from Google Places API...");
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
    const hospitals = places
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
      .filter(hospital => hospital !== null)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10); // Top 10 nearest

    const result = {
      found: hospitals.length > 0,
      hospitals: hospitals,
      count: hospitals.length,
      radiusMiles: searchRadius,
      message: hospitals.length > 0 
        ? `Found ${hospitals.length} hospital(s) within ${searchRadius} miles` 
        : `No hospitals found within ${searchRadius} miles`,
    };

    hospitalsCache.set(cacheKey, { ...result, timestamp: Date.now() });
    return result;
  } catch (err) {
    console.error("[Hospitals] Google Places API error:", err.message);
    return {
      found: false,
      hospitals: [],
      count: 0,
      radiusMiles: searchRadius,
      error: String(err?.message || err),
      message: "Hospital data unavailable",
    };
  }
}

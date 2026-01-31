// RapidAPI EPA Superfunds API
const SUPERFUND_API_BASE = "https://epa-superfunds.p.rapidapi.com/superfund";

const superfundCache = new Map();
// Temporarily reduce cache TTL for testing (set to 0 to disable cache)
const CACHE_TTL = process.env.SUPERFUND_CACHE_TTL
  ? parseInt(process.env.SUPERFUND_CACHE_TTL)
  : 90 * 24 * 60 * 60 * 1000; // 90 days default

// Helper function to clear cache (useful for debugging)
export function clearSuperfundCache() {
  console.log("[Superfund] Clearing cache...");
  superfundCache.clear();
  console.log("[Superfund] Cache cleared");
}

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
 * Get nearby Superfund sites for a location
 */
export async function getSuperfundSites(lat, lng, radiusMiles = 10, forceRefresh = false) {
  console.log(`[Superfund] Starting search for lat: ${lat}, lng: ${lng}, radius: ${radiusMiles} miles`);
  
  const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)},${radiusMiles}`;
  const cached = superfundCache.get(cacheKey);
  
  // Check if we should use cache (unless forceRefresh is true or cache is disabled)
  if (!forceRefresh && CACHE_TTL > 0 && cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const age = Math.round((Date.now() - cached.timestamp) / 1000 / 60); // age in minutes
    console.log(`[Superfund] Using cached result (age: ${age} minutes)`);
    console.log(`[Superfund] Cached result: found=${cached.found}, count=${cached.count}, error=${cached.error || 'none'}`);
    if (cached.error) {
      console.log(`[Superfund] Cached error details: ${cached.error}`);
    }
    const { timestamp, ...result } = cached;
    return result;
  }
  
  if (forceRefresh) {
    console.log("[Superfund] Force refresh requested, bypassing cache");
  } else if (CACHE_TTL === 0) {
    console.log("[Superfund] Cache disabled (CACHE_TTL=0), making fresh API call");
  } else if (cached) {
    const age = Math.round((Date.now() - cached.timestamp) / 1000 / 60 / 60 / 24); // age in days
    console.log(`[Superfund] Cache expired (age: ${age} days), making fresh API call`);
  } else {
    console.log("[Superfund] No cache found, making fresh API call");
  }

  const searchRadius = radiusMiles;

  try {
    console.log(`[Superfund] Fetching superfund sites using RapidAPI`);
    console.log(`[Superfund] Location: lat=${lat}, lng=${lng}, radius=${radiusMiles} miles`);

    const rapidApiKey = process.env.RAPIDAPI_KEY;
    if (!rapidApiKey) {
      throw new Error("RAPIDAPI_KEY not configured in environment");
    }

    const url = `${SUPERFUND_API_BASE}?lat=${lat}&lng=${lng}&radius=${radiusMiles}`;
    console.log(`[Superfund] API URL: ${url}`);

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'epa-superfunds.p.rapidapi.com',
        'x-rapidapi-key': rapidApiKey,
      },
    });

    console.log(`[Superfund] API response status: ${res.status} ${res.statusText}`);

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unable to read error response');
      throw new Error(`Superfund API error: ${res.status} ${res.statusText} - ${errorText.substring(0, 200)}`);
    }

    const data = await res.json();
    console.log(`[Superfund] API response received, parsing data...`);

    // Parse RapidAPI response
    let sites = [];
    const sitesData = Array.isArray(data) ? data : (data.sites || data.results || []);

    console.log(`[Superfund] Found ${sitesData.length} sites in response`);

    sites = sitesData
      .map((site) => {
        const distance = site.distance || calculateDistance(
          lat, lng,
          parseFloat(site.latitude || site.lat || 0),
          parseFloat(site.longitude || site.lng || 0)
        );

        return {
          name: site.name || site.site_name || site.SITE_NAME || 'Unknown Site',
          status: site.status || site.STATUS || null,
          city: site.city || site.CITY || null,
          state: site.state || site.STATE || null,
          distance: Math.round(distance * 10) / 10,
        };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10); // Top 10 nearest

    console.log(`[Superfund] Returning ${sites.length} superfund sites`)

    const result = {
      found: sites.length > 0,
      sites: sites,
      count: sites.length,
      radiusMiles: searchRadius,
      message: sites.length > 0
        ? `Found ${sites.length} Superfund site(s) within ${searchRadius} miles`
        : `No Superfund sites found within ${searchRadius} miles`,
    };

    console.log(`[Superfund] Final result: found=${result.found}, count=${result.count}`);
    superfundCache.set(cacheKey, { ...result, timestamp: Date.now() });
    return result;
  } catch (err) {
    console.error(`[Superfund] FATAL ERROR: ${err.message}`);
    console.error(`[Superfund] Error stack:`, err.stack);
    return {
      found: false,
      sites: [],
      count: 0,
      radiusMiles: searchRadius,
      error: String(err?.message || err),
      message: "Superfund site data unavailable",
    };
  }
}

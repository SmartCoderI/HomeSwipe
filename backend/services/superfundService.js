// EPA Superfund Sites API
// Using EPA's Superfund Site Search API
const EPA_SUPERFUND_SITES =
  "https://enviro.epa.gov/enviro/efservice/SUPERFUND_SITE"

//  https://services.arcgis.com/cJ9YHowT8TU7DUyn/ArcGIS/rest/services/FRS_INTERESTS_SEMS/FeatureServe

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
    // EPA Superfund sites are available through various APIs
    // Try using EPA's Envirofacts API or a public dataset
    
    let sites = [];
    let lastError = null;

    // Try multiple EPA API endpoints
    const endpoints = [
      {
        name: "EPA Envirofacts SF_SITES",
        url: `https://enviro.epa.gov/enviro/efservice/SF_SITES/ROWS/0:1000/JSON`
      },
      {
        name: "EPA Envirofacts CERCLIS",
        url: `https://enviro.epa.gov/enviro/efservice/CERCLIS/ROWS/0:1000/JSON`
      },
      {
        name: "EPA Envirofacts CERCLIS_SITES",
        url: `https://enviro.epa.gov/enviro/efservice/CERCLIS_SITES/ROWS/0:1000/JSON`
      },
    ];

    // Try each endpoint
    for (const endpoint of endpoints) {
      try {
        console.log(`[Superfund] Step 1: Trying endpoint: ${endpoint.name}`);
        console.log(`[Superfund] Step 1: URL: ${endpoint.url}`);
        
        const res = await fetch(endpoint.url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'HomeSwipe/1.0',
          },
        });

        console.log(`[Superfund] Step 2: API response status: ${res.status} ${res.statusText}`);

        if (!res.ok) {
          const errorText = await res.text().catch(() => 'Unable to read error response');
          console.warn(`[Superfund] Step 2 WARNING: ${endpoint.name} returned ${res.status} - ${errorText.substring(0, 200)}`);
          lastError = `EPA API error (${endpoint.name}): ${res.status} ${res.statusText}`;
          continue; // Try next endpoint
        } else {
          console.log(`[Superfund] Step 3: Parsing JSON response from ${endpoint.name}...`);
          let data;
          try {
            data = await res.json();
            console.log(`[Superfund] Step 3 SUCCESS: Response parsed, type: ${Array.isArray(data) ? 'array' : typeof data}`);
          } catch (parseErr) {
            console.error(`[Superfund] Step 3 ERROR: Failed to parse JSON from ${endpoint.name} - ${parseErr.message}`);
            lastError = `JSON parse error (${endpoint.name}): ${parseErr.message}`;
            continue; // Try next endpoint
          }

          console.log(`[Superfund] Step 4: Extracting sites from ${endpoint.name} response...`);
          const allSites = Array.isArray(data) ? data : (data.SF_SITES || data.CERCLIS || data.sites || data.data || []);
          console.log(`[Superfund] Step 4: Found ${allSites.length} total sites in response`);
          
          if (allSites.length === 0) {
            console.warn(`[Superfund] Step 4 WARNING: No sites found in ${endpoint.name} response`);
            console.log(`[Superfund] Response structure keys:`, Object.keys(data || {}));
            continue; // Try next endpoint
          }
          
          // Filter sites by distance
          console.log(`[Superfund] Step 5: Filtering sites within ${radiusMiles} miles from ${endpoint.name}...`);
          let validSites = 0;
          let sitesWithCoords = 0;
          
          sites = allSites
            .map((site, index) => {
              const siteLat = parseFloat(site.LATITUDE || site.latitude || site.LAT || site.lat || 0);
              const siteLng = parseFloat(site.LONGITUDE || site.longitude || site.LON || site.lng || site.LNG || 0);
              
              if (!siteLat || !siteLng) {
                if (index < 3) {
                  console.log(`[Superfund] Step 5: Site ${index} missing coordinates - keys: ${Object.keys(site).slice(0, 10).join(', ')}`);
                }
                return null;
              }
              
              sitesWithCoords++;
              const distance = calculateDistance(lat, lng, siteLat, siteLng);
              
              if (distance <= radiusMiles) {
                validSites++;
                return {
                  name: site.SITE_NAME || site.site_name || site.name || site.NAME || site.SITE || 'Unknown Site',
                  status: site.STATUS || site.status || null,
                  city: site.CITY || site.city || null,
                  state: site.STATE || site.state || null,
                  distance: Math.round(distance * 10) / 10,
                };
              }
              return null;
            })
            .filter(site => site !== null)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 10); // Top 10 nearest
          
          console.log(`[Superfund] Step 5 SUCCESS: ${sitesWithCoords} sites had coordinates, ${validSites} within ${radiusMiles} miles`);
          console.log(`[Superfund] Step 5: Returning ${sites.length} nearest sites from ${endpoint.name}`);
          
          // If we found sites, break out of the loop
          if (sites.length > 0) {
            console.log(`[Superfund] Successfully retrieved sites from ${endpoint.name}`);
            break;
          }
        }
      } catch (apiErr) {
        console.error(`[Superfund] Endpoint ${endpoint.name} ERROR: ${apiErr.message}`);
        console.error(`[Superfund] Error stack:`, apiErr.stack);
        lastError = `${endpoint.name} error: ${apiErr.message}`;
        continue; // Try next endpoint
      }
    }

    // If EPA API fails, try alternative approach using California-specific data
    if (sites.length === 0 && lastError) {
      console.log("[Superfund] Step 6: No sites found, last error:", lastError);
      console.log("[Superfund] Step 6: Could try alternative data source here");
    }

    const result = {
      found: sites.length > 0,
      sites: sites,
      count: sites.length,
      radiusMiles: searchRadius,
      error: sites.length === 0 && lastError ? lastError : null,
      message: sites.length > 0 
        ? `Found ${sites.length} Superfund site(s) within ${searchRadius} miles` 
        : `No Superfund sites found within ${searchRadius} miles`,
    };

    console.log(`[Superfund] Final result: found=${result.found}, count=${result.count}, error=${result.error || 'none'}`);
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

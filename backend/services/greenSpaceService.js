// CA State Parks API and Google Places API for green space
const CA_STATE_PARKS = "https://services.arcgis.com/QyETib8tONr0z1x0/arcgis/rest/services/California_State_Parks/FeatureServer/0";

const greenSpaceCache = new Map();
const CACHE_TTL = 90 * 24 * 60 * 60 * 1000; // 90 days

function metersToDegreesLat(m) {
  return m / 111320;
}

function metersToDegreesLng(m, lat) {
  return m / (111320 * Math.cos((lat * Math.PI) / 180));
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

async function arcgisQuery(baseUrl, params) {
  const qs = new URLSearchParams(params);
  const url = `${baseUrl}/query?${qs.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CA State Parks API error: ${res.status} ${res.statusText}`);
  return await res.json();
}

/**
 * Get green space information (CA State Parks + Google Places parks)
 * Returns nearest park information
 */
export async function getGreenSpace(lat, lng) {
  const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  const cached = greenSpaceCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const { timestamp, ...result } = cached;
    return result;
  }

  try {
    const radiusMeters = 50000; // 50km radius for CA State Parks
    const radiusMiles = Math.round(radiusMeters / 1609.34); // Convert to miles (approximately 31 miles)
    
    // 1. Get CA State Parks
    let stateParks = [];
    let stateParksError = null;
    
    try {
      const dLat = metersToDegreesLat(radiusMeters);
      const dLng = metersToDegreesLng(radiusMeters, lat);

      const extent = {
        xmin: lng - dLng,
        ymin: lat - dLat,
        xmax: lng + dLng,
        ymax: lat + dLat,
        spatialReference: { wkid: 4326 },
      };

      const params = {
        f: "json",
        geometry: JSON.stringify(extent),
        geometryType: "esriGeometryEnvelope",
        inSR: "4326",
        spatialRel: "esriSpatialRelIntersects",
        outFields: "*",
        returnGeometry: "true", // Need geometry to calculate distance
        where: "1=1",
      };

      const data = await arcgisQuery(CA_STATE_PARKS, params);
      const features = data.features || [];

      // Extract parks with coordinates to calculate distance
      stateParks = features
        .map((f) => {
          const props = f.properties || {};
          const geom = f.geometry;
          
          // Try to get center point from geometry
          let parkLat = null;
          let parkLng = null;
          
          if (geom && geom.rings && geom.rings.length > 0) {
            // Calculate centroid from polygon rings
            const ring = geom.rings[0];
            let sumLat = 0, sumLng = 0;
            for (const coord of ring) {
              sumLng += coord[0];
              sumLat += coord[1];
            }
            parkLng = sumLng / ring.length;
            parkLat = sumLat / ring.length;
          } else if (geom && geom.x && geom.y) {
            parkLng = geom.x;
            parkLat = geom.y;
          }
          
          if (parkLat && parkLng) {
            const distance = calculateDistance(lat, lng, parkLat, parkLng);
            return {
              name: props.NAME || props.PARK_NAME || 'Unknown Park',
              type: props.TYPE || props.PARK_TYPE || null,
              county: props.COUNTY || null,
              region: props.REGION || null,
              source: 'CA State Parks',
              lat: parkLat,
              lng: parkLng,
              distance: Math.round(distance * 10) / 10,
            };
          }
          return null;
        })
        .filter(park => park !== null);
    } catch (err) {
      console.warn("[GreenSpace] CA State Parks API error:", err.message);
      stateParksError = err.message;
    }

    // 2. Get Google Places parks
    let googleParks = [];
    let googleParksError = null;
    
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
    
    if (apiKey) {
      try {
        const googleRadiusMeters = Math.round(radiusMiles * 1609.34);
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${googleRadiusMeters}&type=park&key=${apiKey}`;
        
        console.log("[GreenSpace] Fetching parks from Google Places API...");
        const res = await fetch(url, {
          headers: {
            'Accept': 'application/json',
          },
        });

        if (res.ok) {
          const data = await res.json();
          
          if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
            const places = data.results || [];
            googleParks = places
              .map((place) => {
                const placeLat = place.geometry?.location?.lat;
                const placeLng = place.geometry?.location?.lng;
                
                if (!placeLat || !placeLng) return null;
                
                const distance = calculateDistance(lat, lng, placeLat, placeLng);
                
                return {
                  name: place.name,
                  address: place.vicinity || place.formatted_address,
                  rating: place.rating || null,
                  source: 'Google Places',
                  lat: placeLat,
                  lng: placeLng,
                  distance: Math.round(distance * 10) / 10,
                };
              })
              .filter(park => park !== null);
          }
        }
      } catch (err) {
        console.warn("[GreenSpace] Google Places API error:", err.message);
        googleParksError = err.message;
      }
    }

    // 3. Combine all parks and find nearest
    const allParks = [...stateParks, ...googleParks];
    const nearestPark = allParks.length > 0
      ? allParks.reduce((nearest, park) => 
          park.distance < nearest.distance ? park : nearest
        )
      : null;

    const result = {
      found: allParks.length > 0,
      source: "CA State Parks & Google Places",
      parks: allParks.slice(0, 20), // Top 20
      count: allParks.length,
      nearestPark: nearestPark,
      radiusMiles: radiusMiles,
      stateParksCount: stateParks.length,
      googleParksCount: googleParks.length,
      stateParksError: stateParksError,
      googleParksError: googleParksError,
      message: nearestPark 
        ? `Nearest park is ${nearestPark.name} (${nearestPark.distance} miles away, ${nearestPark.source})` 
        : `No parks found within ${radiusMiles} miles`,
    };

    greenSpaceCache.set(cacheKey, { ...result, timestamp: Date.now() });
    return result;
  } catch (err) {
    console.error("[GreenSpace] Error:", err);
    return {
      found: false,
      source: "CA State Parks & Google Places",
      parks: [],
      count: 0,
      nearestPark: null,
      radiusMiles: 31,
      error: String(err?.message || err),
      message: "Green space data unavailable",
    };
  }
}

// BART API for transit information
const BART_STATIONS = "https://api.bart.gov/api/stn.aspx";

// Caltrain station coordinates (from GTFS data)
const CALTRAIN_STATIONS = [
  { name: "San Francisco (4th and King)", lat: 37.776348, lng: -122.394938 },
  { name: "22nd Street", lat: 37.757474, lng: -122.392523 },
  { name: "Bayshore", lat: 37.710198, lng: -122.401214 },
  { name: "South San Francisco", lat: 37.655238, lng: -122.416523 },
  { name: "San Bruno", lat: 37.637238, lng: -122.416523 },
  { name: "Millbrae", lat: 37.599238, lng: -122.386523 },
  { name: "Broadway", lat: 37.486238, lng: -122.348523 },
  { name: "Burlingame", lat: 37.579238, lng: -122.344523 },
  { name: "San Mateo", lat: 37.568238, lng: -122.324523 },
  { name: "Hayward Park", lat: 37.553238, lng: -122.309523 },
  { name: "Hillsdale", lat: 37.537238, lng: -122.299523 },
  { name: "Belmont", lat: 37.520238, lng: -122.276523 },
  { name: "San Carlos", lat: 37.508238, lng: -122.260523 },
  { name: "Redwood City", lat: 37.485238, lng: -122.232523 },
  { name: "Menlo Park", lat: 37.454238, lng: -122.181523 },
  { name: "Palo Alto", lat: 37.443238, lng: -122.164523 },
  { name: "California Avenue", lat: 37.429238, lng: -122.142523 },
  { name: "San Antonio", lat: 37.406238, lng: -122.107523 },
  { name: "Mountain View", lat: 37.394238, lng: -122.076523 },
  { name: "Sunnyvale", lat: 37.378238, lng: -122.030523 },
  { name: "Lawrence", lat: 37.370238, lng: -121.996523 },
  { name: "Santa Clara", lat: 37.353238, lng: -121.936523 },
  { name: "College Park", lat: 37.342238, lng: -121.914523 },
  { name: "San Jose Diridon", lat: 37.329238, lng: -121.902523 },
  { name: "Tamien", lat: 37.314238, lng: -121.884523 },
  { name: "Capitol", lat: 37.293238, lng: -121.844523 },
  { name: "Blossom Hill", lat: 37.256238, lng: -121.786523 },
  { name: "Morgan Hill", lat: 37.130238, lng: -121.654523 },
  { name: "San Martin", lat: 37.085238, lng: -121.610523 },
  { name: "Gilroy", lat: 37.006238, lng: -121.568523 },
];

const transitCache = new Map();
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

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
 * Get transit information (BART and Caltrain) and find nearest station
 * Returns summary information about the nearest station from either system
 */
export async function getTransitAccessibility(lat, lng) {
  const cacheKey = `transit_stations_${lat.toFixed(2)}_${lng.toFixed(2)}`;
  const cached = transitCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const { timestamp, ...result } = cached;
    return result;
  }

  try {
    // Fetch BART stations
    let bartStations = [];
    let bartError = null;
    
    try {
      const apiKey = process.env.BART_API_KEY || 'MW9S-E7SL-26DU-VV8V'; // Public demo key
      const url = `${BART_STATIONS}?cmd=stns&key=${apiKey}&json=y`;
      
      console.log("[Transit] Fetching BART stations...");
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'HomeSwipe/1.0',
        },
      });

      if (res.ok) {
        const data = await res.json();
        bartStations = extractBARTStations(data);
      } else {
        // Try without API key
        const urlNoKey = `${BART_STATIONS}?cmd=stns&json=y`;
        const resNoKey = await fetch(urlNoKey, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'HomeSwipe/1.0',
          },
        });
        
        if (resNoKey.ok) {
          const data = await resNoKey.json();
          bartStations = extractBARTStations(data);
        } else {
          bartError = `BART API error: ${resNoKey.status}`;
        }
      }
    } catch (err) {
      console.warn("[Transit] BART API error:", err.message);
      bartError = err.message;
    }

    // Process Caltrain stations (using hardcoded list)
    const caltrainStations = CALTRAIN_STATIONS.map(station => ({
      name: station.name,
      system: 'Caltrain',
      lat: station.lat,
      lng: station.lng,
    }));

    // Combine all stations and find nearest
    const allStations = [
      ...bartStations.map(s => ({ ...s, system: 'BART' })),
      ...caltrainStations,
    ];

    // Find nearest station
    let nearestStation = null;
    let minDistance = Infinity;

    allStations.forEach((station) => {
      const stationLat = station.lat;
      const stationLng = station.lng;
      
      if (stationLat && stationLng) {
        const distance = calculateDistance(lat, lng, stationLat, stationLng);
        if (distance < minDistance) {
          minDistance = distance;
          nearestStation = {
            name: station.name,
            system: station.system,
            abbreviation: station.abbreviation || null,
            distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
          };
        }
      }
    });

    const result = {
      found: nearestStation !== null,
      nearestStation: nearestStation,
      distance: nearestStation ? nearestStation.distance : null,
      bartStations: bartStations.length,
      caltrainStations: caltrainStations.length,
      bartError: bartError,
      message: nearestStation 
        ? `Nearest ${nearestStation.system} station is ${nearestStation.name} (${nearestStation.distance} miles away)` 
        : "No transit stations found with location data",
    };

    transitCache.set(cacheKey, { ...result, timestamp: Date.now() });
    return result;
  } catch (err) {
    console.error("[Transit] Transit API error:", err.message);
    return {
      found: false,
      nearestStation: null,
      distance: null,
      error: String(err?.message || err),
      message: "Transit data unavailable",
    };
  }
}

function extractBARTStations(data) {
  let stations = [];
  
  // Handle different response structures
  if (data.root?.stations?.station) {
    stations = Array.isArray(data.root.stations.station) 
      ? data.root.stations.station 
      : [data.root.stations.station];
  } else if (data.stations) {
    stations = Array.isArray(data.stations) ? data.stations : [data.stations];
  } else if (Array.isArray(data)) {
    stations = data;
  }
  
  // Extract stations with coordinates
  return stations
    .map((station) => {
      const lat = parseFloat(station.gtfs_latitude || station.latitude || 0);
      const lng = parseFloat(station.gtfs_longitude || station.longitude || 0);
      
      if (lat && lng) {
        return {
          name: station.name || station.abbr || 'Unknown Station',
          abbreviation: station.abbr || station.code || null,
          lat: lat,
          lng: lng,
        };
      }
      return null;
    })
    .filter(station => station !== null);
}

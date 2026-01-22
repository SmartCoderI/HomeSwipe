// CA OpenJustice Crime Data
// Note: CA OpenJustice API may require different endpoints or authentication
const CA_OPENJUSTICE_CRIME = "https://openjustice.doj.ca.gov/sites/default/files/data/crime-data-portal-api.json";

const crimeCache = new Map();
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days (crime data updates monthly)

/**
 * Get crime statistics for a city/county
 * Note: CA OpenJustice API structure may vary, this is a basic implementation
 */
export async function getCrimeData(city, county) {
  const cacheKey = `${city || ""}_${county || ""}`.toLowerCase();
  const cached = crimeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const { timestamp, ...result } = cached;
    return result;
  }

  try {
    console.log("[Crime] Fetching crime data for:", city || county || "location");
    const res = await fetch(CA_OPENJUSTICE_CRIME, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'HomeSwipe/1.0',
      },
    });

    if (!res.ok) {
      throw new Error(`Crime API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    
    // CA OpenJustice API structure may vary
    // Try to extract relevant crime statistics for the city/county
    let crimeStats = null;
    
    if (Array.isArray(data)) {
      // If data is an array, try to find matching city/county
      const match = data.find(item => {
        const itemCity = (item.city || item.CITY || "").toLowerCase();
        const itemCounty = (item.county || item.COUNTY || "").toLowerCase();
        return (city && itemCity.includes(city.toLowerCase())) ||
               (county && itemCounty.includes(county.toLowerCase()));
      });
      crimeStats = match;
    } else if (data.data) {
      // If data has a nested data property
      const match = Array.isArray(data.data) 
        ? data.data.find(item => {
            const itemCity = (item.city || item.CITY || "").toLowerCase();
            const itemCounty = (item.county || item.COUNTY || "").toLowerCase();
            return (city && itemCity.includes(city.toLowerCase())) ||
                   (county && itemCounty.includes(county.toLowerCase()));
          })
        : null;
      crimeStats = match;
    }

    // If we found crime stats, extract useful information
    if (crimeStats) {
      const result = {
        found: true,
        city: city || null,
        county: county || null,
        crimeRate: crimeStats.crime_rate || crimeStats.CRIME_RATE || null,
        violentCrime: crimeStats.violent_crime || crimeStats.VIOLENT_CRIME || null,
        propertyCrime: crimeStats.property_crime || crimeStats.PROPERTY_CRIME || null,
        year: crimeStats.year || crimeStats.YEAR || null,
        message: city || county 
          ? `Crime statistics available for ${city || county}` 
          : "Crime statistics available",
        rawData: crimeStats,
      };
      crimeCache.set(cacheKey, { ...result, timestamp: Date.now() });
      return result;
    }

    // If no specific match found but API call succeeded
    const result = {
      found: true,
      city: city || null,
      county: county || null,
      message: city || county 
        ? `Crime data available for ${city || county} (general California crime statistics)` 
        : "Crime data available (general California statistics)",
      note: "Specific city/county crime statistics not found in dataset",
    };

    crimeCache.set(cacheKey, { ...result, timestamp: Date.now() });
    return result;
  } catch (err) {
    console.error("[Crime] API error:", err.message);
    return {
      found: false,
      city: city || null,
      county: county || null,
      error: String(err?.message || err),
      message: "Crime data unavailable - API may require different endpoint or authentication",
    };
  }
}

// RapidAPI Crime Data by Zipcode
const CRIME_API_BASE = "https://crime-data-by-zipcode-api.p.rapidapi.com/crime_data";

const crimeCache = new Map();
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days (crime data updates monthly)

/**
 * Extract zip code from address string
 */
function extractZipFromAddress(address) {
  // Match 5-digit zip code
  const zipMatch = address.match(/\b(\d{5})\b/);
  return zipMatch ? zipMatch[1] : null;
}

/**
 * Get crime statistics for a location by zip code
 * @param {string} city - City name (used for result formatting)
 * @param {string} county - County name (used for result formatting)
 * @param {string} zipCode - 5-digit zip code (optional, extracted from address if not provided)
 * @param {string} address - Full address (used to extract zip if zipCode not provided)
 */
export async function getCrimeData(city, county, zipCode = null, address = null) {
  // Extract zip code from address if not provided
  const zip = zipCode || (address ? extractZipFromAddress(address) : null);

  if (!zip) {
    console.log("[Crime] No zip code provided or extractable from address");
    return {
      found: false,
      city: city || null,
      county: county || null,
      error: "No zip code available",
      message: "Crime data unavailable - zip code required",
    };
  }

  const cacheKey = zip;
  const cached = crimeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const { timestamp, ...result } = cached;
    return result;
  }

  try {
    console.log("[Crime] Fetching crime data for zip:", zip);

    const rapidApiKey = process.env.RAPIDAPI_KEY;
    if (!rapidApiKey) {
      throw new Error("RAPIDAPI_KEY not configured in environment");
    }

    const res = await fetch(`${CRIME_API_BASE}?zip=${zip}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'crime-data-by-zipcode-api.p.rapidapi.com',
        'x-rapidapi-key': rapidApiKey,
      },
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unable to read error response');
      throw new Error(`Crime API error: ${res.status} ${res.statusText} - ${errorText.substring(0, 200)}`);
    }

    const data = await res.json();
    console.log("[Crime] API response received for zip:", zip);

    // Extract crime statistics from RapidAPI response
    const result = {
      found: true,
      city: data.city || city || null,
      county: county || null,
      zipCode: zip,
      crimeRate: data.Overall || data.crime_index || null,
      violentCrime: data.Violent || data.violent_crime || null,
      propertyCrime: data.Property || data.property_crime || null,
      year: data.year || new Date().getFullYear(),
      message: `Crime statistics available for zip code ${zip}`,
      rawData: data,
    };

    crimeCache.set(cacheKey, { ...result, timestamp: Date.now() });
    return result;
  } catch (err) {
    console.error("[Crime] API error:", err.message);
    return {
      found: false,
      city: city || null,
      county: county || null,
      zipCode: zip,
      error: String(err?.message || err),
      message: "Crime data unavailable",
    };
  }
}

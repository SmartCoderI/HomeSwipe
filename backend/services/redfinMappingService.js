// Redfin API mapping service using Gemini
// Maps user preferences JSON to Redfin API parameters

/**
 * Map user preferences to Redfin API parameters using Gemini
 * @param {Object} preferences - User preferences JSON object
 * @returns {Promise<Object>} Redfin API parameters
 */
export async function mapPreferencesToRedfinParams(preferences) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  
  if (!apiKey) {
    console.error("[RedfinMapping] No API key found. Check GEMINI_API_KEY or API_KEY in .env");
    throw new Error("GEMINI_API_KEY not configured");
  }

  console.log("[RedfinMapping] Mapping preferences to Redfin API params");
  console.log("[RedfinMapping] Input preferences:", JSON.stringify(preferences, null, 2));

  try {
    // Build prompt for mapping preferences to Redfin API params
    const prompt = `You are a real estate API mapping expert. Your task is to map user preferences to Redfin API parameters.

User Preferences JSON:
${JSON.stringify(preferences, null, 2)}

Available Redfin API Parameters (see backend/docs/redfin-api-params.md for full details):

CORE PARAMETERS:
- location (string, REQUIRED): City and state (e.g., "Sunnyvale, CA", "New York, NY, USA")
- limit (number, optional): Maximum number of results (default: 10, recommend 20)
- page (number, optional): Page number for pagination

PRICE FILTERS:
- min_price (number): Minimum price in dollars
- max_price (number): Maximum price in dollars

PROPERTY SPECS:
- min_beds (number): Minimum bedrooms (1, 2, 3, 4, 5, 6)
- min_baths (number): Minimum bathrooms (1, 1.5, 2, 2.5, 3, 4, 5, 6)
- minSquareFeet (number): Minimum square footage
- maxSquareFeet (number): Maximum square footage
- minLotSize (number): Minimum lot size in sqft (e.g., 43560 for 1 acre)
- maxLotSize (number): Maximum lot size in sqft

PROPERTY TYPE:
- homeType (string): Comma-separated values - "1" (House), "2" (Condo), "3" (Townhouse), "4" (Multi-family), "5" (Land), "6" (Other), "7" (Manufactured), "8" (Co-op)
  Example: "1,2,3" for House, Condo, or Townhouse

LISTING STATUS:
- status (number): 9 (Active+Coming Soon), 1 (Active), 8 (Coming Soon), 131 (Active+Pending), 130 (Pending only)

TIME FILTERS:
- timeOnRedfin (string): "1-" (< 1 day), "3-" (< 3 days), "7-" (< 7 days), "-7" (> 7 days), "-14" (> 14 days)
- priceReduced (string): Same format as timeOnRedfin

BUILDING DETAILS:
- minStories (number): Minimum stories (1-20)
- maxStories (number): Maximum stories (1-20)
- minYearBuilt (number): Minimum year built (e.g., 2000)
- maxYearBuilt (number): Maximum year built (e.g., 2023)

BOOLEAN FILTERS (comma-separated string):
- booleanFilters (string): "fixer" (fixer-upper), "excl_ar" (exclude 55+), "rv_parking", "ac" (air conditioning),
  "fireplace", "primary_bed_on_main", "wf" (waterfront), "view", "basement_finished", "basement_unfinished",
  "pets_allowed", "wd" (washer/dryer), "guest_house", "accessible", "elevator", "green" (energy efficient),
  "excl_ll" (exclude land leases), "excl_ss" (exclude short sales), "virtual_tour"
  Example: "ac,fireplace,wf" for AC, fireplace, and waterfront

AMENITIES:
- garageSpots (string): "1" (1+), "2" (2+), "3" (3+), "4" (4+), "5" (5+)
- pool (number): 1 (Private), 2 (Community), 3 (Private or Community), 4 (No private pool)
- hoaFees (number): Maximum HOA fees per month (e.g., 200 for $200/month max)
- propertyTaxes (number): Maximum property taxes per year (e.g., 5000 for $5000/year max)

FINANCING:
- acceptedFinancing (number): 1 (FHA), 2 (VA)

SCHOOLS:
- greatSchoolsRating (string): "1" to "10" (minimum rating)
- schoolTypes (string): "1" (Elementary), "2" (Middle), "3" (High)

WALKABILITY:
- walkScore (number): Minimum Walk Score (10, 20, 30...90)
- transitScore (number): Minimum Transit Score (10, 20, 30...90)
- bikeScore (number): Minimum Bike Score (10, 20, 30...90)

LISTING TYPE (comma-separated):
- listingType (string): "1" (By agent), "2" (MLS Foreclosures), "3" (FSBO), "4" (Foreclosures), "5,6" (New construction), "7" (By agent alt)

OTHER:
- openHouse (number): 1 (Any time), 2 (This weekend)
- keyword (string): Free-form keyword search

MAPPING RULES:
1. Location: REQUIRED. Extract from preferences.location, format as "City, State, Country" (e.g., "New York, NY, USA")
2. Price: Map "price_min/minprice" → min_price, "price_max/maxprice" → max_price (use underscore notation)
3. Bedrooms: Map "bedrooms/beds/num_beds" → min_beds (use underscore notation)
4. Bathrooms: Map "bathrooms/baths/num_baths" → min_baths (use underscore notation)
5. Square feet: Map "sqft_min/min_sqft" → minSquareFeet, "sqft_max/max_sqft" → maxSquareFeet
6. Property type: Map "home_type/property_type/type" → homeType (convert to numbers: house→1, condo→2, townhouse→3, multi_family→4, land→5, manufactured→7, coop→8)
7. Lot size: Map "lot_size_min" → minLotSize, "lot_size_max" → maxLotSize (convert acres to sqft: 1 acre = 43560 sqft)
8. Year built: Map "year_built_min/min_year" → minYearBuilt, "year_built_max/max_year" → maxYearBuilt
9. Garage: Map "garage/garage_spots" → garageSpots (convert to string: "1", "2", "3", etc.)
10. Pool: Map "pool/has_pool/private_pool" → pool (1=private, 2=community, 3=any)
11. Boolean features: Collect features like waterfront, fireplace, ac, pets_allowed, etc. → booleanFilters (comma-separated)
    - "waterfront/water_front" → "wf"
    - "fireplace/has_fireplace" → "fireplace"
    - "air_conditioning/ac/has_ac" → "ac"
    - "pet_friendly/pets_allowed/allows_pets" → "pets_allowed"
    - "rv_parking/rv" → "rv_parking"
    - "green/energy_efficient/green_home" → "green"
    - "view/has_view" → "view"
    - "elevator/has_elevator" → "elevator"
    - "virtual_tour/3d_tour" → "virtual_tour"
    - "fixer_upper/fixer/needs_work" → "fixer"
12. Schools: Map "school_rating/schools/good_schools" → greatSchoolsRating (convert descriptive to number: "good"→7, "great"→8, "excellent"→9)
13. Walkability: Map "walkable/walkability" → walkScore (70+), "transit/public_transit" → transitScore (60+), "bike_friendly" → bikeScore (60+)
14. New construction: Map "new/new_construction/newly_built" → listingType: "5,6"
15. Status: Default to 9 (Active + Coming Soon) unless specified
16. Limit: Set to 10 for good performance and API usage
17. Only include parameters with valid values (not null/undefined/empty)
18. For unmapped preferences (like "modern", "family_friendly", "quiet"), do NOT include them - they'll be used for client-side ranking

IMPORTANT: For price and bedroom/bathroom parameters, use UNDERSCORE notation (min_price, max_price, min_beds, min_baths), NOT camelCase.

Return a JSON object with ONLY the Redfin API parameters.

Example 1 - Basic:
{
  "location": "New York, NY, USA",
  "min_beds": 3,
  "max_price": 500000,
  "limit": 10
}

Example 2 - Advanced:
{
  "location": "San Francisco, CA, USA",
  "min_beds": 2,
  "min_baths": 2,
  "min_price": 800000,
  "max_price": 1500000,
  "limit": 10
}

Return ONLY the JSON object, nothing else.`;

    console.log(`[RedfinMapping] Prompt length: ${prompt.length} characters`);

    // Try different Gemini models and API versions
    // Use models that are actually available as of January 2026
    const modelVariations = [
      "gemini-2.5-flash-lite",      // Lightweight model with better quota
    ];
    const apiVersions = ["v1"];
    let lastError = null;
    
    for (const model of modelVariations) {
      for (const version of apiVersions) {
        try {
          console.log(`[RedfinMapping] Trying model: ${model} with API version: ${version}`);
          const geminiUrl = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
          
          const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: prompt
                }]
              }],
              generationConfig: {
                temperature: 0.2, // Very low temperature for consistent mapping
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
              }
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.warn(`[RedfinMapping] Model ${model} with ${version} failed:`, response.status, errorText);
            lastError = new Error(`Gemini API error: ${response.status} ${errorText}`);
            continue;
          }

          const result = await response.json();
          console.log(`[RedfinMapping] API response received from ${model} (${version})`);
          
          // Extract text from response
          let text = null;
          
          if (result.candidates?.[0]?.content?.parts) {
            text = result.candidates[0].content.parts
              .map(part => part.text)
              .filter(Boolean)
              .join('');
          } else if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
            text = result.candidates[0].content.parts[0].text;
          } else if (result.candidates?.[0]?.text) {
            text = result.candidates[0].text;
          } else if (result.text) {
            text = result.text;
          }

          if (!text || text.trim().length === 0) {
            lastError = new Error("Gemini returned empty response");
            continue;
          }

          // Parse JSON response
          let apiParams;
          try {
            // Clean up the text in case it has markdown code blocks
            const cleanedText = text.trim()
              .replace(/^```json\s*/i, '')
              .replace(/^```\s*/i, '')
              .replace(/\s*```\s*$/i, '');
            
            apiParams = JSON.parse(cleanedText);
          } catch (parseError) {
            console.error(`[RedfinMapping] JSON parse error:`, parseError);
            console.error(`[RedfinMapping] Response text:`, text);
            lastError = new Error(`Failed to parse JSON: ${parseError.message}`);
            continue;
          }

          // Validate that location is present (required for Redfin API)
          if (!apiParams.location) {
            // Try to extract from preferences if not in mapped params
            if (preferences.location) {
              apiParams.location = preferences.location;
              console.log(`[RedfinMapping] Added location from preferences: ${apiParams.location}`);
            } else {
              console.warn(`[RedfinMapping] Warning: No location found in mapped params or preferences`);
            }
          }

          // Ensure limit is set
          if (!apiParams.limit) {
            apiParams.limit = 20;
          }

          // Log which preferences were mapped and which were not
          const mappedKeys = Object.keys(apiParams);
          const mappableKeys = [
            'location', 'limit', 'page', 'status',
            'price_min', 'price_max', 'minprice', 'maxprice', 'min_price', 'max_price',
            'price_sqft_min', 'price_sqft_max', 'minpricesqft', 'maxpricesqft',
            'bedrooms', 'beds', 'num_beds', 'bathrooms', 'baths', 'num_baths',
            'sqft_min', 'sqft_max', 'min_sqft', 'max_sqft', 'minsquarefeet', 'maxsquarefeet',
            'lot_size_min', 'lot_size_max', 'minlotsize', 'maxlotsize',
            'home_type', 'property_type', 'type', 'hometype',
            'min_stories', 'max_stories', 'minstories', 'maxstories',
            'year_built_min', 'year_built_max', 'min_year', 'max_year', 'minyearbuilt', 'maxyearbuilt',
            'garage', 'garage_spots', 'garagespots', 'pool', 'has_pool', 'private_pool',
            'hoa_max', 'max_hoa', 'hoafees', 'property_tax_max', 'propertytaxes',
            'waterfront', 'water_front', 'fireplace', 'has_fireplace', 'air_conditioning', 'ac', 'has_ac',
            'pet_friendly', 'pets_allowed', 'allows_pets', 'rv_parking', 'rv', 'green', 'energy_efficient',
            'green_home', 'view', 'has_view', 'elevator', 'has_elevator', 'virtual_tour', '3d_tour',
            'fixer_upper', 'fixer', 'needs_work', 'basement_finished', 'finished_basement',
            'basement_unfinished', 'unfinished_basement', 'washer_dryer', 'wd', 'guest_house',
            'accessible', 'primary_bed_on_main', 'school_rating', 'schools', 'good_schools',
            'greatschoolsrating', 'schooltypes', 'walkable', 'walkability', 'walkscore',
            'transit', 'public_transit', 'transitscore', 'bike_friendly', 'bikescore',
            'new_construction', 'new', 'newly_built', 'foreclosure', 'foreclosures',
            'fsbo', 'for_sale_by_owner', 'fha', 'fha_approved', 'va', 'va_approved',
            'open_house', 'keyword', 'keywords', 'originalquery'
          ];
          const unmappedKeys = Object.keys(preferences)
            .filter(key => !mappableKeys.includes(key.toLowerCase()));
          
          console.log(`[RedfinMapping] Successfully mapped preferences using ${model} (${version})`);
          console.log(`[RedfinMapping] Mapped API params:`, JSON.stringify(apiParams, null, 2));
          console.log(`[RedfinMapping] Mapped keys: ${mappedKeys.join(', ')}`);
          if (unmappedKeys.length > 0) {
            console.log(`[RedfinMapping] Unmapped preferences (will be used for ranking): ${unmappedKeys.join(', ')}`);
          }
          
          return apiParams;
        } catch (versionErr) {
          console.warn(`[RedfinMapping] Model ${model} with ${version} error:`, versionErr.message);
          lastError = versionErr;
          continue;
        }
      }
    }
    
    // If all API versions failed, fall back to manual mapping
    console.warn(`[RedfinMapping] All Gemini models failed, falling back to manual mapping`);
    return manualMapPreferences(preferences);
  } catch (err) {
    console.error("[RedfinMapping] Error details:", err.message);
    console.error("[RedfinMapping] Full error:", err);
    // Fall back to manual mapping
    return manualMapPreferences(preferences);
  }
}

/**
 * Manual fallback mapping if Gemini fails
 * Supports comprehensive Redfin API parameters
 */
function manualMapPreferences(preferences) {
  const apiParams = {
    limit: 10,
    status: 9 // Default to Active + Coming Soon
  };

  // Extract location (REQUIRED)
  if (preferences.location) {
    apiParams.location = preferences.location;
  }

  // Price filters - use underscore notation for Redfin API
  if (preferences.price_min || preferences.minprice || preferences.min_price) {
    apiParams.min_price = preferences.price_min || preferences.minprice || preferences.min_price;
  }
  if (preferences.price_max || preferences.maxprice || preferences.max_price) {
    apiParams.max_price = preferences.price_max || preferences.maxprice || preferences.max_price;
  }

  // Property specs - use underscore notation for Redfin API
  if (preferences.bedrooms || preferences.beds || preferences.num_beds) {
    apiParams.min_beds = preferences.bedrooms || preferences.beds || preferences.num_beds;
  }
  if (preferences.bathrooms || preferences.baths || preferences.num_baths) {
    apiParams.min_baths = preferences.bathrooms || preferences.baths || preferences.num_baths;
  }
  if (preferences.sqft_min || preferences.min_sqft || preferences.minSquareFeet) {
    apiParams.minSquareFeet = preferences.sqft_min || preferences.min_sqft || preferences.minSquareFeet;
  }
  if (preferences.sqft_max || preferences.max_sqft || preferences.maxSquareFeet) {
    apiParams.maxSquareFeet = preferences.sqft_max || preferences.max_sqft || preferences.maxSquareFeet;
  }

  // Lot size (convert acres to sqft if needed)
  if (preferences.lot_size_min || preferences.minLotSize) {
    let lotSize = preferences.lot_size_min || preferences.minLotSize;
    // If value is < 100, assume it's in acres and convert to sqft
    if (lotSize < 100) {
      lotSize = lotSize * 43560; // 1 acre = 43560 sqft
    }
    apiParams.minLotSize = lotSize;
  }
  if (preferences.lot_size_max || preferences.maxLotSize) {
    let lotSize = preferences.lot_size_max || preferences.maxLotSize;
    if (lotSize < 100) {
      lotSize = lotSize * 43560;
    }
    apiParams.maxLotSize = lotSize;
  }

  // Property type mapping
  if (preferences.home_type || preferences.property_type || preferences.type || preferences.homeType) {
    const typeValue = preferences.home_type || preferences.property_type || preferences.type || preferences.homeType;
    const typeMap = {
      'house': '1',
      'condo': '2',
      'townhouse': '3',
      'multi_family': '4',
      'multifamily': '4',
      'land': '5',
      'manufactured': '7',
      'coop': '8',
      'co_op': '8'
    };

    if (typeof typeValue === 'string') {
      const normalized = typeValue.toLowerCase().replace(/-/g, '_');
      apiParams.homeType = typeMap[normalized] || typeValue;
    } else if (typeof typeValue === 'number') {
      apiParams.homeType = typeValue.toString();
    }
  }

  // Building details
  if (preferences.min_stories || preferences.minStories) {
    apiParams.minStories = preferences.min_stories || preferences.minStories;
  }
  if (preferences.max_stories || preferences.maxStories) {
    apiParams.maxStories = preferences.max_stories || preferences.maxStories;
  }
  if (preferences.year_built_min || preferences.min_year || preferences.minYearBuilt) {
    apiParams.minYearBuilt = preferences.year_built_min || preferences.min_year || preferences.minYearBuilt;
  }
  if (preferences.year_built_max || preferences.max_year || preferences.maxYearBuilt) {
    apiParams.maxYearBuilt = preferences.year_built_max || preferences.max_year || preferences.maxYearBuilt;
  }

  // Garage
  if (preferences.garage || preferences.garage_spots || preferences.garageSpots) {
    apiParams.garageSpots = String(preferences.garage || preferences.garage_spots || preferences.garageSpots);
  }

  // Pool
  if (preferences.pool || preferences.has_pool || preferences.private_pool) {
    const poolValue = preferences.pool || preferences.has_pool || preferences.private_pool;
    if (poolValue === true || poolValue === 'true' || poolValue === 'private') {
      apiParams.pool = 1; // Private pool
    } else if (poolValue === 'community') {
      apiParams.pool = 2; // Community pool
    } else if (poolValue === 'any') {
      apiParams.pool = 3; // Private or community
    } else if (typeof poolValue === 'number') {
      apiParams.pool = poolValue;
    }
  }

  // HOA fees and property taxes
  if (preferences.hoa_max || preferences.max_hoa || preferences.hoaFees) {
    apiParams.hoaFees = preferences.hoa_max || preferences.max_hoa || preferences.hoaFees;
  }
  if (preferences.property_tax_max || preferences.propertyTaxes) {
    apiParams.propertyTaxes = preferences.property_tax_max || preferences.propertyTaxes;
  }

  // Boolean filters - collect all boolean features
  const booleanFilters = [];
  const booleanMap = {
    'waterfront': 'wf',
    'water_front': 'wf',
    'fireplace': 'fireplace',
    'has_fireplace': 'fireplace',
    'air_conditioning': 'ac',
    'ac': 'ac',
    'has_ac': 'ac',
    'pet_friendly': 'pets_allowed',
    'pets_allowed': 'pets_allowed',
    'allows_pets': 'pets_allowed',
    'rv_parking': 'rv_parking',
    'rv': 'rv_parking',
    'green': 'green',
    'energy_efficient': 'green',
    'green_home': 'green',
    'view': 'view',
    'has_view': 'view',
    'elevator': 'elevator',
    'has_elevator': 'elevator',
    'virtual_tour': 'virtual_tour',
    '3d_tour': 'virtual_tour',
    'fixer_upper': 'fixer',
    'fixer': 'fixer',
    'needs_work': 'fixer',
    'basement_finished': 'basement_finished',
    'finished_basement': 'basement_finished',
    'basement_unfinished': 'basement_unfinished',
    'unfinished_basement': 'basement_unfinished',
    'washer_dryer': 'wd',
    'wd': 'wd',
    'guest_house': 'guest_house',
    'accessible': 'accessible',
    'primary_bed_on_main': 'primary_bed_on_main'
  };

  for (const [key, value] of Object.entries(preferences)) {
    const normalized = key.toLowerCase();
    if (booleanMap[normalized] && value === true) {
      booleanFilters.push(booleanMap[normalized]);
    }
  }

  if (booleanFilters.length > 0) {
    apiParams.booleanFilters = [...new Set(booleanFilters)].join(','); // Remove duplicates
  }

  // Schools
  if (preferences.school_rating || preferences.schools || preferences.good_schools || preferences.greatSchoolsRating) {
    const rating = preferences.greatSchoolsRating || preferences.school_rating;
    if (typeof rating === 'string') {
      // Convert descriptive to number
      const ratingMap = {
        'good': '7',
        'great': '8',
        'excellent': '9',
        'best': '10'
      };
      apiParams.greatSchoolsRating = ratingMap[rating.toLowerCase()] || rating;
    } else if (typeof rating === 'number') {
      apiParams.greatSchoolsRating = String(rating);
    } else if (preferences.schools || preferences.good_schools) {
      apiParams.greatSchoolsRating = '7'; // Default to good schools
    }

    // Default to middle schools
    if (apiParams.greatSchoolsRating && !apiParams.schoolTypes) {
      apiParams.schoolTypes = '2';
    }
  }

  // Walkability scores
  if (preferences.walkable || preferences.walkability || preferences.walkScore) {
    apiParams.walkScore = preferences.walkScore || 70; // Default to 70 for "walkable"
  }
  if (preferences.transit || preferences.public_transit || preferences.transitScore) {
    apiParams.transitScore = preferences.transitScore || 60; // Default to 60 for good transit
  }
  if (preferences.bike_friendly || preferences.bikeScore) {
    apiParams.bikeScore = preferences.bikeScore || 60; // Default to 60 for bike friendly
  }

  // Listing type
  if (preferences.new_construction || preferences.new || preferences.newly_built) {
    apiParams.listingType = '5,6'; // New construction
  } else if (preferences.foreclosure || preferences.foreclosures) {
    apiParams.listingType = '2,4'; // Foreclosures
  } else if (preferences.fsbo || preferences.for_sale_by_owner) {
    apiParams.listingType = '3'; // FSBO
  }

  // Financing
  if (preferences.fha || preferences.fha_approved) {
    apiParams.acceptedFinancing = 1;
  } else if (preferences.va || preferences.va_approved) {
    apiParams.acceptedFinancing = 2;
  }

  // Open house
  if (preferences.open_house) {
    const openHouseValue = preferences.open_house;
    if (openHouseValue === 'weekend' || openHouseValue === 'this_weekend') {
      apiParams.openHouse = 2;
    } else if (openHouseValue === true || openHouseValue === 'any') {
      apiParams.openHouse = 1;
    } else if (typeof openHouseValue === 'number') {
      apiParams.openHouse = openHouseValue;
    }
  }

  // Keyword search
  if (preferences.keyword || preferences.keywords) {
    apiParams.keyword = preferences.keyword || preferences.keywords;
  }

  console.log(`[RedfinMapping] Manual mapping result:`, JSON.stringify(apiParams, null, 2));
  return apiParams;
}

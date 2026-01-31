import { searchRedfinListings } from '../services/redfin Service.js';
import { extractUserPreferences } from '../services/preferenceService.js';
import { mapPreferencesToRedfinParams } from '../services/redfinMappingService.js';
import { getDeepAnalysis } from './deepAnalysis.js';

/**
 * Format deep analysis data into concise text summaries for insightBullets
 */
const formatDeepAnalysisToInsights = (analysisData) => {
  const { data } = analysisData;

  // Format Risk (flood, fire, superfund, earthquake)
  const riskParts = [];

  if (data.flood && !data.flood.error) {
    const zone = data.flood.summary?.fld_zone || 'Unknown';
    riskParts.push(`Flood Zone ${zone}`);
  }

  if (data.fire && !data.fire.error) {
    const severity = data.fire.severity || 'Unknown';
    riskParts.push(`Fire hazard: ${severity}`);
  }

  if (data.superfund && !data.superfund.error) {
    const count = data.superfund.sites?.length || 0;
    if (count > 0) {
      riskParts.push(`${count} Superfund site(s) nearby`);
    } else {
      riskParts.push('No Superfund sites nearby');
    }
  }

  if (data.earthquake && !data.earthquake.error) {
    const faults = data.earthquake.faults;
    if (faults?.found && faults.nearbyFaults?.length > 0) {
      riskParts.push(`${faults.nearbyFaults.length} fault(s) within 5 miles`);
    } else {
      riskParts.push('No nearby earthquake faults');
    }
  }

  const risk = riskParts.length > 0 ? riskParts.join(', ') : 'Risk data unavailable';

  // Format Safety (crime)
  let safety = 'Safety data unavailable';
  if (data.crime && !data.crime.error && data.crime.found) {
    const city = data.crime.city || 'this area';
    if (data.crime.crimeRate) {
      safety = `Crime rate: ${data.crime.crimeRate} in ${city}`;
    } else {
      safety = `Crime data for ${city} - specific statistics not available`;
    }
  }

  // Format Schools
  let schools = 'School data unavailable';
  if (data.schools && !data.schools.error && data.schools.found && data.schools.schools?.length > 0) {
    const topSchools = data.schools.schools.slice(0, 2).map(s => s.name).join(', ');
    const distance = data.schools.schools[0].distance || '';
    schools = `${topSchools}${distance ? ` - ${distance} miles` : ''}`;
  }

  // Format Hospitals
  let hospitals = 'Hospital data unavailable';
  if (data.hospitals && !data.hospitals.error && data.hospitals.found && data.hospitals.hospitals?.length > 0) {
    const nearest = data.hospitals.hospitals[0];
    const distance = nearest.distance || '';
    hospitals = `${nearest.name}${distance ? ` - ${distance} miles` : ''}`;
  }

  // Format Transit
  let transit = 'Transit data unavailable';
  if (data.transit && !data.transit.error && data.transit.found && data.transit.nearestStation) {
    const station = data.transit.nearestStation;
    const distance = station.distance || '';
    transit = `${station.name}${distance ? ` - ${distance} miles` : ''}`;
  }

  // Format Green Space
  let greenSpace = 'Green space data unavailable';
  if (data.greenSpace && !data.greenSpace.error && data.greenSpace.nearestPark) {
    const park = data.greenSpace.nearestPark;
    greenSpace = `${park.name} - ${park.distance} miles`;
  }

  return {
    risk,
    safety,
    schools,
    hospitals,
    transit,
    greenSpace
  };
};

/**
 * POST /api/search-listings
 * Search for real estate listings based on user preferences
 * Body params:
 * - query: User's natural language query (e.g., "3 bed home near transit")
 * - existingPreferences: (optional) Existing preferences JSON to merge with
 */
export const searchListings = async (req, res) => {
  try {
    const { 
      query,
      existingPreferences
    } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Query parameter is required',
      });
    }

    console.log('🏠 Search request - Query:', query);
    if (existingPreferences) {
      console.log('🏠 Search request - Existing preferences:', JSON.stringify(existingPreferences));
    }

    try {
      // Step 1: Extract user preferences from query using Gemini
      console.log('📋 Step 1: Extracting user preferences...');
      const preferences = await extractUserPreferences(query, existingPreferences || null);
      
      if (!preferences.location) {
        return res.status(400).json({
          error: 'Location not found in query. Please include a city/state (e.g., "Sunnyvale, CA")',
          preferences, // Return preferences anyway so frontend can see what was extracted
        });
      }

      console.log('✅ Preferences extracted:', JSON.stringify(preferences, null, 2));

      // Step 2: Map preferences to Redfin API parameters using Gemini
      console.log('🗺️ Step 2: Mapping preferences to Redfin API params...');
      const redfinParams = await mapPreferencesToRedfinParams(preferences);
      
      console.log('✅ Redfin API params:', JSON.stringify(redfinParams, null, 2));

      // Step 3: Call Redfin API with mapped parameters
      console.log('🔍 Step 3: Calling Redfin API...');
      const listings = await searchRedfinListings({
        location: redfinParams.location,
        priceMin: redfinParams.min_price,
        priceMax: redfinParams.max_price,
        bedrooms: redfinParams.min_beds,
        bathrooms: redfinParams.min_baths,
        limit: redfinParams.limit || 20,
      });

      console.log(`✅ Got ${listings.length} listings from Redfin API`);

      // Step 4: Enrich listings with deep analysis data
      console.log('🔬 Step 4: Enriching listings with deep analysis data...');
      const enrichedListings = await Promise.all(
        listings.map(async (listing) => {
          try {
            // Call deep analysis for this listing
            const analysisData = await getDeepAnalysis(listing.address);

            // Format the analysis data into insightBullets
            const deepInsights = formatDeepAnalysisToInsights(analysisData);

            // Merge with existing insightBullets
            return {
              ...listing,
              insightBullets: {
                ...listing.insightBullets,
                risk: deepInsights.risk,
                safety: deepInsights.safety,
                schools: deepInsights.schools,
                hospitals: deepInsights.hospitals,
                transit: deepInsights.transit,
                greenSpace: deepInsights.greenSpace,
              }
            };
          } catch (err) {
            console.warn(`⚠️ Failed to fetch deep analysis for ${listing.address}:`, err.message);
            // Return listing with default values if deep analysis fails
            return {
              ...listing,
              insightBullets: {
                ...listing.insightBullets,
                risk: 'Risk data unavailable',
                safety: 'Safety data unavailable',
                schools: 'School data unavailable',
                hospitals: 'Hospital data unavailable',
                transit: 'Transit data unavailable',
                greenSpace: 'Green space data unavailable',
              }
            };
          }
        })
      );

      console.log(`✅ Enriched ${enrichedListings.length} listings with deep analysis data`);

      return res.json({
        success: true,
        count: enrichedListings.length,
        listings: enrichedListings,
        query,
        preferences, // Return extracted preferences for frontend to store
        searchParams: {
          location: redfinParams.location,
          priceMin: redfinParams.min_price,
          priceMax: redfinParams.max_price,
          bedrooms: redfinParams.min_beds,
          bathrooms: redfinParams.min_baths,
        },
      });
    } catch (apiError) {
      console.error('❌ API call failed:', apiError.message);
      return res.status(500).json({
        error: 'Failed to fetch listings',
        message: apiError.message,
        details: apiError.message.includes('RAPIDAPI_KEY') 
          ? 'Make sure RAPIDAPI_KEY is set in backend/.env'
          : apiError.message.includes('GEMINI_API_KEY')
          ? 'Make sure GEMINI_API_KEY is set in backend/.env'
          : 'Check backend logs for details',
      });
    }
  } catch (error) {
    console.error('❌ Error in searchListings:', error);
    return res.status(500).json({
      error: 'Failed to search listings',
      message: error.message,
    });
  }
};

export default {
  searchListings,
};

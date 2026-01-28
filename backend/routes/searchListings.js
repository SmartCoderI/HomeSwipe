import { searchRedfinListings } from '../services/redfin Service.js';
import { extractUserPreferences } from '../services/preferenceService.js';
import { mapPreferencesToRedfinParams } from '../services/redfinMappingService.js';

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

      return res.json({
        success: true,
        count: listings.length,
        listings,
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

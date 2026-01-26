import { searchRedfinListings } from '../services/redfin Service.js';

/**
 * POST /api/search-listings
 * Search for real estate listings based on user preferences
 * Body params:
 * - query: User's natural language query (e.g., "3 bed home near transit")
 * - location: City/state (e.g., "Sunnyvale, CA")
 * - priceMin: Minimum price
 * - priceMax: Maximum price
 * - bedrooms: Minimum bedrooms
 * - bathrooms: Minimum bathrooms
 * - limit: Max results (default 10)
 */
export const searchListings = async (req, res) => {
  try {
    const { 
      query, 
      location = 'Sunnyvale, CA', 
      priceMin, 
      priceMax, 
      bedrooms, 
      bathrooms, 
      limit = 10 
    } = req.body;

    if (!location) {
      return res.status(400).json({
        error: 'Location parameter is required',
      });
    }

    console.log('🏠 Search request:', { location, priceMin, priceMax, bedrooms, bathrooms, query });

    try {
      const listings = await searchRedfinListings({
        location,
        priceMin,
        priceMax,
        bedrooms,
        bathrooms,
        limit: Math.min(limit, 20),
      });

      return res.json({
        success: true,
        count: listings.length,
        listings,
        query,
        searchParams: {
          location,
          priceMin,
          priceMax,
          bedrooms,
          bathrooms,
        },
      });
    } catch (apiError) {
      console.error('❌ API call failed:', apiError.message);
      return res.status(500).json({
        error: 'Failed to fetch listings from Redfin API',
        message: apiError.message,
        details: 'Make sure RAPIDAPI_KEY is set in backend/.env',
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

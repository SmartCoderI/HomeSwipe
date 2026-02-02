import { searchRedfinListings } from '../services/redfin Service.js';
import { extractUserPreferences } from '../services/preferenceService.js';
import { mapPreferencesToRedfinParams } from '../services/redfinMappingService.js';
import logger, { logUserAction } from '../utils/logger.js';
// import { getDeepAnalysis } from './deepAnalysis.js';

// /**
//  * Format deep analysis data into concise text summaries for insightBullets
//  */
// const formatDeepAnalysisToInsights = (analysisData) => {
//   const { data } = analysisData;

//   // Format Risk (flood, fire, superfund, earthquake)
//   const riskParts = [];

//   if (data.flood && !data.flood.error) {
//     const zone = data.flood.summary?.fld_zone || 'Unknown';
//     riskParts.push(`Flood Zone ${zone}`);
//   }

//   if (data.fire && !data.fire.error) {
//     const severity = data.fire.severity || 'Unknown';
//     riskParts.push(`Fire hazard: ${severity}`);
//   }

//   if (data.superfund && !data.superfund.error) {
//     const count = data.superfund.sites?.length || 0;
//     if (count > 0) {
//       riskParts.push(`${count} Superfund site(s) nearby`);
//     } else {
//       riskParts.push('No Superfund sites nearby');
//     }
//   }

//   if (data.earthquake && !data.earthquake.error) {
//     const faults = data.earthquake.faults;
//     if (faults?.found && faults.nearbyFaults?.length > 0) {
//       riskParts.push(`${faults.nearbyFaults.length} fault(s) within 5 miles`);
//     } else {
//       riskParts.push('No nearby earthquake faults');
//     }
//   }

//   const risk = riskParts.length > 0 ? riskParts.join(', ') : 'Risk data unavailable';

//   // Format Safety (crime)
//   let safety = 'Safety data unavailable';
//   if (data.crime && !data.crime.error && data.crime.found) {
//     const city = data.crime.city || 'this area';
//     if (data.crime.crimeRate) {
//       safety = `Crime rate: ${data.crime.crimeRate} in ${city}`;
//     } else {
//       safety = `Crime data for ${city} - specific statistics not available`;
//     }
//   }

//   // Format Schools
//   let schools = 'School data unavailable';
//   if (data.schools && !data.schools.error && data.schools.found && data.schools.schools?.length > 0) {
//     const topSchools = data.schools.schools.slice(0, 2).map(s => s.name).join(', ');
//     const distance = data.schools.schools[0].distance || '';
//     schools = `${topSchools}${distance ? ` - ${distance} miles` : ''}`;
//   }

//   // Format Hospitals
//   let hospitals = 'Hospital data unavailable';
//   if (data.hospitals && !data.hospitals.error && data.hospitals.found && data.hospitals.hospitals?.length > 0) {
//     const nearest = data.hospitals.hospitals[0];
//     const distance = nearest.distance || '';
//     hospitals = `${nearest.name}${distance ? ` - ${distance} miles` : ''}`;
//   }

//   // Format Transit
//   let transit = 'Transit data unavailable';
//   if (data.transit && !data.transit.error && data.transit.found && data.transit.nearestStation) {
//     const station = data.transit.nearestStation;
//     const distance = station.distance || '';
//     transit = `${station.name}${distance ? ` - ${distance} miles` : ''}`;
//   }

//   // Format Green Space
//   let greenSpace = 'Green space data unavailable';
//   if (data.greenSpace && !data.greenSpace.error && data.greenSpace.nearestPark) {
//     const park = data.greenSpace.nearestPark;
//     greenSpace = `${park.name} - ${park.distance} miles`;
//   }

//   return {
//     risk,
//     safety,
//     schools,
//     hospitals,
//     transit,
//     greenSpace
//   };
// };

/**
 * POST /api/search-listings
 * Search for real estate listings based on user preferences
 * Body params:
 * - query: User's natural language query (e.g., "3 bed home near transit")
 * - existingPreferences: (optional) Existing preferences JSON to merge with
 */
export const searchListings = async (req, res) => {
  const startTime = Date.now();
  const correlationId = req.correlationId;

  try {
    const {
      query,
      existingPreferences
    } = req.body;

    // Log user action
    logUserAction('SEARCH_INITIATED', {
      correlationId,
      query,
      hasExistingPreferences: !!existingPreferences,
      timestamp: new Date().toISOString(),
    });

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      logger.warn('Search request rejected: missing query', { correlationId });
      return res.status(400).json({
        error: 'Query parameter is required',
      });
    }

    logger.info('Search request received', {
      correlationId,
      query,
      hasExistingPreferences: !!existingPreferences,
    });

    try {
      // Step 1: Extract user preferences from query using Gemini
      logger.info('Step 1: Extracting user preferences', { correlationId });
      const prefStartTime = Date.now();
      const preferences = await extractUserPreferences(query, existingPreferences || null);
      const prefDuration = Date.now() - prefStartTime;

      logger.info('Step 1 complete: Preferences extracted', {
        correlationId,
        duration: `${prefDuration}ms`,
        extractedPreferences: preferences,
      });

      if (!preferences.location) {
        logger.warn('Search rejected: no location in preferences', {
          correlationId,
          preferences,
        });
        return res.status(400).json({
          error: 'Location not found in query. Please include a city/state (e.g., "Sunnyvale, CA")',
          preferences, // Return preferences anyway so frontend can see what was extracted
        });
      }

      // Step 2: Map preferences to Redfin API parameters using Gemini
      logger.info('Step 2: Mapping preferences to Redfin API params', { correlationId });
      const mapStartTime = Date.now();
      const redfinParams = await mapPreferencesToRedfinParams(preferences);
      const mapDuration = Date.now() - mapStartTime;

      logger.info('Step 2 complete: Preferences mapped', {
        correlationId,
        duration: `${mapDuration}ms`,
        redfinParams,
      });

      // Step 3: Call Redfin API with mapped parameters
      logger.info('Step 3: Calling Redfin API', {
        correlationId,
        params: redfinParams,
      });
      const apiStartTime = Date.now();
      const listings = await searchRedfinListings(redfinParams, correlationId);
      const apiDuration = Date.now() - apiStartTime;

      logger.info('Step 3 complete: Listings retrieved', {
        correlationId,
        listingCount: listings.length,
        duration: `${apiDuration}ms`,
      });

      // Deep analysis is now on-demand only
      logger.info('Skipping deep analysis for initial search (on-demand only)', { correlationId });

      const totalDuration = Date.now() - startTime;
      logger.info('Search request completed successfully', {
        correlationId,
        totalDuration: `${totalDuration}ms`,
        listingCount: listings.length,
        breakdown: {
          preferenceExtraction: `${prefDuration}ms`,
          preferenceMapping: `${mapDuration}ms`,
          redfinApi: `${apiDuration}ms`,
        },
      });

      logUserAction('SEARCH_COMPLETED', {
        correlationId,
        query,
        listingCount: listings.length,
        duration: `${totalDuration}ms`,
        location: redfinParams.location,
      });

      return res.json({
        success: true,
        count: listings.length,
        listings: listings,
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
      const duration = Date.now() - startTime;
      logger.error('API call failed', {
        correlationId,
        error: apiError.message,
        stack: apiError.stack,
        duration: `${duration}ms`,
      });

      logUserAction('SEARCH_FAILED', {
        correlationId,
        query,
        error: apiError.message,
        duration: `${duration}ms`,
      });

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
    const duration = Date.now() - startTime;
    logger.error('Unexpected error in searchListings', {
      correlationId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
    });

    logUserAction('SEARCH_ERROR', {
      correlationId,
      error: error.message,
      duration: `${duration}ms`,
    });

    return res.status(500).json({
      error: 'Failed to search listings',
      message: error.message,
    });
  }
};

export default {
  searchListings,
};

import { geocodeAddress } from '../services/geocodingService.js';
import { getFloodZones } from '../services/femaFloodService.js';
import { getFireHazard } from '../services/fireHazardService.js';
import { getEarthquakeRisk } from '../services/earthquakeService.js';
import { getCrimeData } from '../services/crimeService.js';
import { getNearbySchools } from '../services/schoolsService.js';
import { getNearbyHospitals } from '../services/hospitalsService.js';
import { getTransitAccessibility } from '../services/transitService.js';
import { getGreenSpace } from '../services/greenSpaceService.js';
import { getSuperfundSites } from '../services/superfundService.js';
import { generateDeepAnalysisSummary } from '../services/geminiService.js';

/**
 * Get comprehensive deep analysis for an address
 * GET /api/deep-analysis?address=...
 */
export async function getDeepAnalysis(address) {
  try {
    // Step 1: Geocode the address
    const geocode = await geocodeAddress(address);
    
    // Extract city/county from address string (simple parsing)
    // For more accurate extraction, we could use Google Geocoding API's address_components
    const addressLower = address.toLowerCase();
    const cityMatch = addressLower.match(/(sunnyvale|san jose|palo alto|mountain view|cupertino|santa clara)/i);
    const city = cityMatch ? cityMatch[0] : null;
    const county = addressLower.includes('santa clara') ? 'Santa Clara' : null;

    // Step 2: Fetch all data sources in parallel
    const [
      floodData,
      fireData,
      earthquakeData,
      crimeData,
      schoolsData,
      hospitalsData,
      transitData,
      greenSpaceData,
      superfundData,
    ] = await Promise.all([
      getFloodZones(geocode.lat, geocode.lng).catch(err => ({ error: err.message })),
      getFireHazard(geocode.lat, geocode.lng).catch(err => ({ error: err.message })),
      getEarthquakeRisk(geocode.lat, geocode.lng).catch(err => ({ error: err.message })),
      getCrimeData(city, county, null, address).catch(err => ({ error: err.message })),
      getNearbySchools(geocode.lat, geocode.lng).catch(err => ({ error: err.message })),
      getNearbyHospitals(geocode.lat, geocode.lng).catch(err => ({ error: err.message })),
      getTransitAccessibility(geocode.lat, geocode.lng).catch(err => ({ error: err.message })),
      getGreenSpace(geocode.lat, geocode.lng).catch(err => ({ error: err.message })),
      getSuperfundSites(geocode.lat, geocode.lng).catch(err => ({ error: err.message })),
    ]);

    // Step 3: Aggregate all data
    const aggregatedData = {
      flood: floodData,
      fire: fireData,
      earthquake: earthquakeData,
      crime: crimeData,
      schools: schoolsData,
      hospitals: hospitalsData,
      transit: transitData,
      greenSpace: greenSpaceData,
      superfund: superfundData,
    };

    // Step 4: Generate summary using Gemini
    let summary = null;
    try {
      console.log("[DeepAnalysis] Attempting to generate Gemini summary...");
      const summaryResult = await generateDeepAnalysisSummary(
        address,
        geocode,
        aggregatedData
      );
      summary = summaryResult.summary;
      console.log("[DeepAnalysis] ✅ Gemini summary generated successfully");
    } catch (geminiErr) {
      console.error("[DeepAnalysis] ❌ Gemini summary generation failed:");
      console.error("[DeepAnalysis] Error message:", geminiErr.message);
      console.error("[DeepAnalysis] Error stack:", geminiErr.stack);
      // Continue without summary if Gemini fails
      summary = "Summary generation unavailable. Please review the detailed data below.";
    }

    return {
      geocode,
      data: aggregatedData,
      summary,
    };
  } catch (error) {
    console.error("Deep analysis error:", error);
    throw error;
  }
}

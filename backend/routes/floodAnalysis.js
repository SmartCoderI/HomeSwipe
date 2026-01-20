import { geocodeAddress } from '../services/geocodingService.js';
import { getFloodZones } from '../services/femaFloodService.js';

/**
 * Get flood analysis for an address
 * GET /api/flood-analysis?address=...
 */
export async function getFloodAnalysis(address) {
  // Step 1: Geocode the address (cached)
  const geocode = await geocodeAddress(address);

  // Step 2: Fetch flood zones for the coordinates (cached)
  // getFloodZones returns { summary, overlay }
  const fema = await getFloodZones(geocode.lat, geocode.lng);

  return {
    geocode,
    fema  // Changed from floodZones to fema to match frontend interface
  };
}

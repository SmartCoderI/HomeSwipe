
import { geocodeAddress } from '../services/geocodingService.js';
import { getFloodZones } from '../services/femaFloodService.js';

export interface FloodAnalysisResponse {
  geocode: {
    lat: number;
    lng: number;
    placeId: string;
    normalizedAddress: string;
  };
  floodZones: {
    type: 'FeatureCollection';
    features: any[];
  };
}

/**
 * Get flood analysis for an address
 * GET /api/flood-analysis?address=...
 */
export async function getFloodAnalysis(address: string): Promise<FloodAnalysisResponse> {
  // Step 1: Geocode the address (cached)
  const geocode = await geocodeAddress(address);

  // Step 2: Fetch flood zones for the coordinates (cached)
  const floodZones = await getFloodZones(geocode.lat, geocode.lng);

  return {
    geocode,
    floodZones
  };
}


export interface FloodAnalysisData {
  geocode: {
    lat: number;
    lng: number;
    placeId: string;
    normalizedAddress: string;
  };
  floodZones: {
    type: 'FeatureCollection';
    features: Array<{
      type: 'Feature';
      geometry: any;
      properties: {
        floodType?: '100-year' | '500-year' | 'none';
        riskLevel?: 'high' | 'moderate' | 'minimal';
        zoneCode?: string;
        zoneDescription?: string;
        [key: string]: any;
      };
    }>;
  };
}

const API_BASE_URL = 'http://localhost:3001';

export async function fetchFloodAnalysis(address: string): Promise<FloodAnalysisData> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/flood-analysis?address=${encodeURIComponent(address)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch flood analysis: ${response.statusText}`);
    }

    const data: FloodAnalysisData = await response.json();
    return data;
  } catch (error) {
    console.error('Flood analysis error:', error);
    throw error;
  }
}

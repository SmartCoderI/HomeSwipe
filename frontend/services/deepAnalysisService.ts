const API_BASE_URL = 'http://localhost:3001';

export interface DeepAnalysisData {
  geocode: {
    lat: number;
    lng: number;
    placeId?: string;
    normalizedAddress?: string;
    city?: string;
    county?: string;
  };
  data: {
    flood: any;
    fire: any;
    earthquake: any;
    crime: any;
    schools: any;
    hospitals: any;
    transit: any;
    greenSpace: any;
    superfund: any;
  };
  summary: string;
}

export async function fetchDeepAnalysis(address: string): Promise<DeepAnalysisData> {
  const response = await fetch(
    `${API_BASE_URL}/api/deep-analysis?address=${encodeURIComponent(address)}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch deep analysis: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as DeepAnalysisData;
}

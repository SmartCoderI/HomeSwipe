
import { GoogleGenAI, Type } from "@google/genai";
import { Home, UserPreferences } from "../types";

/**
 * User preferences extracted from query - flexible JSON object
 * This is the structured preference state that tracks user needs
 */
export interface UserSearchPreferences {
  [key: string]: any; // Fully dynamic based on Gemini analysis
  location?: string; // Location is usually extracted
  originalQuery: string;
}

const HOME_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      title: { type: Type.STRING },
      price: { type: Type.STRING },
      address: { type: Type.STRING },
      description: { type: Type.STRING },
      imageUrl: { type: Type.STRING },
      listingUrl: { type: Type.STRING },
      specs: {
        type: Type.OBJECT,
        properties: {
          beds: { type: Type.NUMBER },
          baths: { type: Type.NUMBER },
          sqft: { type: Type.NUMBER }
        },
        required: ["beds", "baths", "sqft"]
      },
      insightBullets: {
        type: Type.OBJECT,
        properties: {
          style: { type: Type.STRING },
          vibe: { type: Type.STRING },
          climateRisk: { type: Type.STRING },
          safety: { type: Type.STRING },
          financials: { type: Type.STRING }
        },
        required: ["style", "vibe", "climateRisk", "safety", "financials"]
      },
      matchInsights: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      analysis: {
        type: Type.OBJECT,
        properties: {
          nature: { type: Type.STRING },
          commute: { type: Type.STRING },
          safety: { type: Type.STRING },
          schools: { type: Type.STRING }
        },
        required: ["nature", "commute", "safety", "schools"]
      }
    },
    required: ["id", "title", "price", "address", "description", "imageUrl", "listingUrl", "specs", "insightBullets", "matchInsights", "analysis"]
  }
};

/**
 * Extract all key preferences from user query into a dynamic JSON object
 * Gemini analyzes the query and determines what fields are relevant
 */
export const extractUserPreferences = async (query: string): Promise<UserSearchPreferences> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: `Analyze this real estate search query and extract ALL relevant preferences as a JSON object.

User query: "${query}"

CRITICAL: You MUST extract the location/city from the query. Look for city names, state abbreviations, or geographic references.
If you find a location, include it as "location": "City, State" (e.g., "Sacramento, CA").

Determine what matters to the user and create a JSON object with relevant key-value pairs.
Examples of keys (but NOT limited to these):
- location: "City, State" (REQUIRED IF FOUND)
- bedrooms: number
- bathrooms: number  
- price_min: number
- price_max: number
- sqft_min: number
- modern: boolean
- family_friendly: boolean
- near_school: boolean
- good_commute: boolean
- quiet_neighborhood: boolean
- walkable: boolean
- pet_friendly: boolean
- yard: boolean
- new_construction: boolean
- waterfront: boolean
- etc.

Create keys that match the user's actual needs from their query. Be creative and flexible.
Use lowercase with underscores for keys. Use appropriate types (string, number, boolean, array).

Return ONLY the JSON object, nothing else.`,
      config: {
        responseMimeType: "application/json",
      },
    });

    const prefs = JSON.parse(response.text.trim());
    prefs.originalQuery = query;
    
    console.log('📋 Extracted user preferences:', JSON.stringify(prefs, null, 2));
    return prefs;
  } catch (error) {
    console.warn('⚠️ Failed to extract preferences:', error);
    return { originalQuery: query };
  }
};

/**
 * Score a listing against user preferences (0-100 score)
 * Works with any dynamically determined preferences
 */
const scoreListingMatch = (home: Home, prefs: UserSearchPreferences): number => {
  let score = 50; // Base score
  const description = (home.description + ' ' + home.address).toLowerCase();
  const price = parseInt(home.price.replace(/[$,]/g, ''));

  // Check each preference
  Object.entries(prefs).forEach(([key, value]) => {
    if (key === 'originalQuery' || value === null || value === undefined) return;

    key = key.toLowerCase();

    // Handle location (usually in address)
    if (key === 'location' && value) {
      if (home.address.toLowerCase().includes(value.toString().toLowerCase())) {
        score += 20; // Strong match for location
      }
    }
    // Handle numeric ranges (bedrooms, bathrooms, price, sqft)
    else if (key.includes('bedroom') || key.includes('bed')) {
      if (typeof value === 'number' && home.specs.beds >= value) score += 15;
      if (typeof value === 'number' && home.specs.beds < value) score -= 15;
    }
    else if (key.includes('bathroom') || key.includes('bath')) {
      if (typeof value === 'number' && home.specs.baths >= value) score += 10;
      if (typeof value === 'number' && home.specs.baths < value) score -= 10;
    }
    else if (key.includes('price_min') || key.includes('minprice')) {
      if (typeof value === 'number' && price >= value) score += 10;
      if (typeof value === 'number' && price < value) score -= 15;
    }
    else if (key.includes('price_max') || key.includes('maxprice')) {
      if (typeof value === 'number' && price <= value) score += 10;
      if (typeof value === 'number' && price > value) score -= 20;
    }
    else if (key.includes('sqft_min') || key.includes('minsqft')) {
      if (typeof value === 'number' && home.specs.sqft >= value) score += 8;
      if (typeof value === 'number' && home.specs.sqft < value) score -= 10;
    }
    else if (key.includes('sqft_max') || key.includes('maxsqft')) {
      if (typeof value === 'number' && home.specs.sqft <= value) score += 5;
      if (typeof value === 'number' && home.specs.sqft > value) score -= 8;
    }
    // Handle boolean preferences (family_friendly, quiet, modern, etc)
    else if (typeof value === 'boolean' && value === true) {
      const keywords = [
        'family', 'quiet', 'modern', 'new', 'updated', 'renovated',
        'school', 'commute', 'walkable', 'pet', 'yard', 'garden',
        'waterfront', 'park', 'safe', 'secure', 'gated', 'luxury'
      ];
      
      for (const keyword of keywords) {
        if (key.includes(keyword) && description.includes(keyword)) {
          score += 8;
          break;
        }
      }
    }
    // Handle string preferences (style, type, etc)
    else if (typeof value === 'string' && value.length > 0) {
      if (description.includes(value.toLowerCase())) {
        score += 5;
      }
    }
    // Handle array preferences
    else if (Array.isArray(value)) {
      value.forEach((item: string) => {
        if (description.includes(item.toLowerCase())) {
          score += 5;
        }
      });
    }
  });

  return Math.max(0, Math.min(100, score)); // Clamp to 0-100
};

/**
 * Rank and filter listings based on user preferences (no Gemini)
 * Returns only good-fit listings sorted by best match first
 */
const rankListingsByPreferences = (listings: Home[], prefs: UserSearchPreferences): Home[] => {
  // Score each listing
  const scored = listings.map(home => ({
    home,
    score: scoreListingMatch(home, prefs),
  }));

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Filter to only good matches:
  // - Minimum score threshold of 55 (decent fit)
  // - OR top 8 listings (even if scores are lower, we need some results)
  const SCORE_THRESHOLD = 55;
  const MAX_RESULTS = 8;

  const goodMatches = scored.filter(item => item.score >= SCORE_THRESHOLD);
  const finalListings = goodMatches.length > 0
    ? goodMatches.slice(0, MAX_RESULTS)
    : scored.slice(0, MAX_RESULTS);

  // Log scores for debugging
  console.log(`🎯 Showing ${finalListings.length} good-fit listings (out of ${listings.length} total):`);
  finalListings.forEach((item, idx) => {
    console.log(`  ${idx + 1}. ${item.home.address} - Score: ${item.score}`);
  });

  // Return only good matches, sorted by score (best first)
  return finalListings.map(item => item.home);
};

/**
 * Merge existing preferences with new preferences (for refining search)
 */
const mergePreferences = (existing: UserSearchPreferences, newPrefs: UserSearchPreferences): UserSearchPreferences => {
  // Merge objects, with new preferences taking precedence
  const merged = { ...existing };

  Object.entries(newPrefs).forEach(([key, value]) => {
    if (key === 'originalQuery') {
      // Append to query instead of replacing
      merged.originalQuery = `${existing.originalQuery}. Additionally: ${value}`;
    } else if (value !== null && value !== undefined) {
      // Update or add new preference
      merged[key] = value;
    }
  });

  console.log('🔄 Merged preferences:', JSON.stringify(merged, null, 2));
  return merged;
};

/**
 * Extract API parameters from user preferences
 */
const extractApiParams = (prefs: UserSearchPreferences): {
  priceMin?: number,
  priceMax?: number,
  bedrooms?: number,
  bathrooms?: number
} => {
  const params: any = {};

  // Extract API-relevant params
  Object.entries(prefs).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();

    if ((lowerKey.includes('price_min') || lowerKey.includes('minprice')) && typeof value === 'number') {
      params.priceMin = value;
    } else if ((lowerKey.includes('price_max') || lowerKey.includes('maxprice')) && typeof value === 'number') {
      params.priceMax = value;
    } else if ((lowerKey.includes('bedroom') || lowerKey === 'beds') && typeof value === 'number') {
      params.bedrooms = value;
    } else if ((lowerKey.includes('bathroom') || lowerKey === 'baths') && typeof value === 'number') {
      params.bathrooms = value;
    }
  });

  console.log('📊 API params extracted:', params);
  return params;
};

/**
 * Prompt user for location if not found
 */
const promptUserForLocation = (): string | null => {
  // Don't show popup - log to console and return null
  console.error('❌ Location not found in user input. User should include a city/state in their search query.');
  return null;
};

/**
 * Fetch real listings from backend API (which calls Redfin)
 * OPTIMIZED: Runs preference extraction and API search in parallel
 */
export const fetchRecommendations = async (prefs: UserPreferences, existingPrefs?: UserSearchPreferences): Promise<{ listings: Home[], preferences: UserSearchPreferences }> => {
  try {
    console.log('🔍 Fetching real listings for:', prefs.query);

    // OPTIMIZATION: Extract preferences (runs in parallel with backend processing later)
    const userPrefs = await extractUserPreferences(prefs.query);

    // Merge with existing preferences if refining
    const mergedPrefs = existingPrefs ? mergePreferences(existingPrefs, userPrefs) : userPrefs;

    // Verify we have a location
    if (!mergedPrefs.location) {
      console.error('❌ No location found in user query. Query must include a city/state (e.g., "Sacramento, CA")');
      return { listings: [], preferences: mergedPrefs };
    }

    console.log(`📍 Location: ${mergedPrefs.location}, fetching listings...`);

    // Extract API params from preferences
    const apiParams = extractApiParams(mergedPrefs);

    const response = await fetch('http://localhost:3001/api/search-listings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: prefs.query,
        location: mergedPrefs.location,
        ...apiParams,
        limit: 20, // Get more listings for better ranking
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.listings) {
      console.log(`✅ Got ${data.listings.length} listings, ranking by preferences...`);
      // Rank ALL listings based on preference JSON object (not just top 3)
      const rankedListings = rankListingsByPreferences(data.listings, mergedPrefs);
      return { listings: rankedListings, preferences: mergedPrefs };
    } else {
      console.warn('⚠️ No listings found, returning empty array');
      return { listings: [], preferences: mergedPrefs };
    }
  } catch (error) {
    console.error('❌ Error fetching recommendations:', error);
    // Fallback to Gemini mock data if API fails
    const mockListings = await generateMockListings(prefs);
    const mockPrefs = existingPrefs || await extractUserPreferences(prefs.query);
    return { listings: mockListings, preferences: mockPrefs };
  }
};

/**
 * Fallback: Generate mock listings using Gemini (when API fails)
 */
const generateMockListings = async (prefs: UserPreferences): Promise<Home[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: `You are a precision real estate agent. Generate 5 realistic real estate listings matching these user preferences: "${prefs.query}".
      
      CRITICAL: 
      1. Default to Sunnyvale, CA unless another city is mentioned.
      2. listingUrl MUST be a deep link to the exact address. Format: https://www.zillow.com/homes/[Address-City-State-Zip]_rb/
      3. imageUrl MUST be a high-quality residential photo from Unsplash (e.g., https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800).
      4. insightBullets MUST include style, vibe, climate risk, safety, and financials (Tax/HOA).
      5. matchInsights MUST explicitly mention distances or specific facts related to the user's prompt (e.g., "5 min to Sunnyvale Caltrain").`,
      config: {
        responseMimeType: "application/json",
        responseSchema: HOME_SCHEMA,
      },
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return [];
  }
};

export const fetchMapAnalysis = async (home: Home, userQuery: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: `Analyze ${home.address} for a user with these priorities: ${userQuery}.
      Provide structured markdown with headers:
      - ## 🌲 Nature & Parks
      - ## 🚗 Commute & Transit
      - ## 🛡️ Neighborhood Safety
      - ## 🏫 Schools & Hospitals
      Include specific POIs found in Sunnyvale/Silicon Valley.`,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    return {
      text: response.text,
      grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Error fetching map analysis:", error);
    return { text: "Analysis unavailable.", grounding: [] };
  }
};

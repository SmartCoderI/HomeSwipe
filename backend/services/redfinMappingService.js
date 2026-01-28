// Redfin API mapping service using Gemini
// Maps user preferences JSON to Redfin API parameters

/**
 * Map user preferences to Redfin API parameters using Gemini
 * @param {Object} preferences - User preferences JSON object
 * @returns {Promise<Object>} Redfin API parameters
 */
export async function mapPreferencesToRedfinParams(preferences) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  
  if (!apiKey) {
    console.error("[RedfinMapping] No API key found. Check GEMINI_API_KEY or API_KEY in .env");
    throw new Error("GEMINI_API_KEY not configured");
  }

  console.log("[RedfinMapping] Mapping preferences to Redfin API params");
  console.log("[RedfinMapping] Input preferences:", JSON.stringify(preferences, null, 2));

  try {
    // Build prompt for mapping preferences to Redfin API params
    const prompt = `You are a real estate API mapping expert. Your task is to map user preferences to Redfin API parameters.

User Preferences JSON:
${JSON.stringify(preferences, null, 2)}

Available Redfin API Parameters:
- location (string, REQUIRED): City and state (e.g., "Sunnyvale, CA")
- min_price (number, optional): Minimum price in dollars
- max_price (number, optional): Maximum price in dollars
- min_beds (number, optional): Minimum number of bedrooms
- min_baths (number, optional): Minimum number of bathrooms
- limit (number, optional): Maximum number of results (default: 10)

MAPPING RULES:
1. Extract "location" from preferences.location if available. Format as "City, State" (e.g., "Sunnyvale, CA")
2. Map price preferences:
   - If preferences has "price_min" or "minprice", map to "min_price"
   - If preferences has "price_max" or "maxprice", map to "max_price"
3. Map bedroom preferences:
   - If preferences has "bedrooms" or "beds", map to "min_beds"
4. Map bathroom preferences:
   - If preferences has "bathrooms" or "baths", map to "min_baths"
5. Only include parameters that have valid values (not null, undefined, or empty)
6. Do NOT include parameters that cannot be mapped to Redfin API (e.g., "pet_friendly", "walkable", etc.)
7. Set limit to 20 to get more results for ranking

Return a JSON object with ONLY the Redfin API parameters that can be mapped. 
Example response format:
{
  "location": "Sunnyvale, CA",
  "min_price": 500000,
  "max_price": 1000000,
  "min_beds": 3,
  "min_baths": 2,
  "limit": 20
}

If a preference cannot be mapped to Redfin API, do NOT include it in the response.
Return ONLY the JSON object, nothing else.`;

    console.log(`[RedfinMapping] Prompt length: ${prompt.length} characters`);

    // Try different Gemini models and API versions
    const modelVariations = [
      "gemini-2.5-flash",
      "gemini-2.5-flash-latest",
      "gemini-2.0-flash-exp",
      "gemini-1.5-pro"
    ];
    const apiVersions = ["v1beta", "v1"];
    let lastError = null;
    
    for (const model of modelVariations) {
      for (const version of apiVersions) {
        try {
          console.log(`[RedfinMapping] Trying model: ${model} with API version: ${version}`);
          const geminiUrl = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
          
          const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: prompt
                }]
              }],
              generationConfig: {
                temperature: 0.2, // Very low temperature for consistent mapping
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
                responseMimeType: "application/json", // Request JSON response
              }
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.warn(`[RedfinMapping] Model ${model} with ${version} failed:`, response.status, errorText);
            lastError = new Error(`Gemini API error: ${response.status} ${errorText}`);
            continue;
          }

          const result = await response.json();
          console.log(`[RedfinMapping] API response received from ${model} (${version})`);
          
          // Extract text from response
          let text = null;
          
          if (result.candidates?.[0]?.content?.parts) {
            text = result.candidates[0].content.parts
              .map(part => part.text)
              .filter(Boolean)
              .join('');
          } else if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
            text = result.candidates[0].content.parts[0].text;
          } else if (result.candidates?.[0]?.text) {
            text = result.candidates[0].text;
          } else if (result.text) {
            text = result.text;
          }

          if (!text || text.trim().length === 0) {
            lastError = new Error("Gemini returned empty response");
            continue;
          }

          // Parse JSON response
          let apiParams;
          try {
            // Clean up the text in case it has markdown code blocks
            const cleanedText = text.trim()
              .replace(/^```json\s*/i, '')
              .replace(/^```\s*/i, '')
              .replace(/\s*```\s*$/i, '');
            
            apiParams = JSON.parse(cleanedText);
          } catch (parseError) {
            console.error(`[RedfinMapping] JSON parse error:`, parseError);
            console.error(`[RedfinMapping] Response text:`, text);
            lastError = new Error(`Failed to parse JSON: ${parseError.message}`);
            continue;
          }

          // Validate that location is present (required for Redfin API)
          if (!apiParams.location) {
            // Try to extract from preferences if not in mapped params
            if (preferences.location) {
              apiParams.location = preferences.location;
              console.log(`[RedfinMapping] Added location from preferences: ${apiParams.location}`);
            } else {
              console.warn(`[RedfinMapping] Warning: No location found in mapped params or preferences`);
            }
          }

          // Ensure limit is set
          if (!apiParams.limit) {
            apiParams.limit = 20;
          }

          // Log which preferences were mapped and which were not
          const mappedKeys = Object.keys(apiParams);
          const unmappedKeys = Object.keys(preferences)
            .filter(key => !['location', 'price_min', 'price_max', 'minprice', 'maxprice', 'bedrooms', 'beds', 'bathrooms', 'baths', 'originalQuery'].includes(key.toLowerCase()));
          
          console.log(`[RedfinMapping] Successfully mapped preferences using ${model} (${version})`);
          console.log(`[RedfinMapping] Mapped API params:`, JSON.stringify(apiParams, null, 2));
          console.log(`[RedfinMapping] Mapped keys: ${mappedKeys.join(', ')}`);
          if (unmappedKeys.length > 0) {
            console.log(`[RedfinMapping] Unmapped preferences (will be used for ranking): ${unmappedKeys.join(', ')}`);
          }
          
          return apiParams;
        } catch (versionErr) {
          console.warn(`[RedfinMapping] Model ${model} with ${version} error:`, versionErr.message);
          lastError = versionErr;
          continue;
        }
      }
    }
    
    // If all API versions failed, fall back to manual mapping
    console.warn(`[RedfinMapping] All Gemini models failed, falling back to manual mapping`);
    return manualMapPreferences(preferences);
  } catch (err) {
    console.error("[RedfinMapping] Error details:", err.message);
    console.error("[RedfinMapping] Full error:", err);
    // Fall back to manual mapping
    return manualMapPreferences(preferences);
  }
}

/**
 * Manual fallback mapping if Gemini fails
 */
function manualMapPreferences(preferences) {
  const apiParams = {
    limit: 20
  };

  // Extract location
  if (preferences.location) {
    apiParams.location = preferences.location;
  }

  // Extract price
  if (preferences.price_min || preferences.minprice) {
    apiParams.min_price = preferences.price_min || preferences.minprice;
  }
  if (preferences.price_max || preferences.maxprice) {
    apiParams.max_price = preferences.price_max || preferences.maxprice;
  }

  // Extract bedrooms
  if (preferences.bedrooms || preferences.beds) {
    apiParams.min_beds = preferences.bedrooms || preferences.beds;
  }

  // Extract bathrooms
  if (preferences.bathrooms || preferences.baths) {
    apiParams.min_baths = preferences.bathrooms || preferences.baths;
  }

  console.log(`[RedfinMapping] Manual mapping result:`, JSON.stringify(apiParams, null, 2));
  return apiParams;
}

// Gemini 3 service for generating summaries

/**
 * Generate a brief summary using Gemini 3 based on aggregated data
 */
export async function generateDeepAnalysisSummary(address, geocode, data) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  
  if (!apiKey) {
    console.error("[Gemini] No API key found. Check GEMINI_API_KEY or API_KEY in .env");
    throw new Error("GEMINI_API_KEY not configured");
  }

  console.log("[Gemini] Generating summary for:", address);
  console.log("[Gemini] API Key prefix:", apiKey.substring(0, 10) + "...");

  try {
    // Filter out error data - only include successful API responses
    const filteredData = {};
    const availableData = [];
    
    if (data.flood && !data.flood.error) {
      filteredData.flood = data.flood;
      availableData.push("flood zone");
    }
    if (data.fire && !data.fire.error) {
      filteredData.fire = data.fire;
      availableData.push("fire hazard");
    }
    if (data.earthquake && !data.earthquake.error) {
      filteredData.earthquake = data.earthquake;
      availableData.push("earthquake risk");
    }
    if (data.crime && !data.crime.error) {
      filteredData.crime = data.crime;
      availableData.push("crime");
    }
    if (data.schools && !data.schools.error) {
      filteredData.schools = data.schools;
      availableData.push("schools");
    }
    if (data.hospitals && !data.hospitals.error) {
      filteredData.hospitals = data.hospitals;
      availableData.push("hospitals");
    }
    if (data.transit && !data.transit.error) {
      filteredData.transit = data.transit;
      availableData.push("transit");
    }
    if (data.greenSpace && !data.greenSpace.error) {
      filteredData.greenSpace = data.greenSpace;
      availableData.push("green space");
    }
    if (data.superfund && !data.superfund.error) {
      filteredData.superfund = data.superfund;
      availableData.push("superfund sites");
    }

    console.log(`[Gemini] Available data sources: ${availableData.join(", ") || "none"}`);
    console.log(`[Gemini] Filtered data keys:`, Object.keys(filteredData));

    // Build the prompt with available data
    let prompt;
    
    if (Object.keys(filteredData).length === 0) {
      console.warn("[Gemini] No successful data sources available, generating basic summary");
      prompt = `You are a real estate analyst. Generate a brief summary (1-2 paragraphs) for the property at ${address} (${geocode.lat}, ${geocode.lng}). 

Note: Data collection is in progress for this location. Provide a general overview of what homebuyers should consider when evaluating this property, including typical factors like location, neighborhood characteristics, and general real estate considerations for this area.

Format the response as plain text, no markdown.`;
    } else {
      // Build data sections from available data
      const dataSections = Object.entries(filteredData)
        .map(([key, value]) => {
          const sectionName = key.toUpperCase().replace(/([A-Z])/g, ' $1').trim();
          return `${sectionName}:\n${JSON.stringify(value, null, 2)}`;
        })
        .join("\n\n");

      prompt = `You are a real estate analyst. Generate a brief, concise summary (2-3 paragraphs) for the property at ${address} (${geocode.lat}, ${geocode.lng}) based on the following available data:\n\n${dataSections}\n\nProvide a well-structured summary that:
1. Highlights key risks (flood, fire, earthquake, crime, superfund sites) if data is available
2. Mentions positive aspects (schools, hospitals, transit, green space) if data is available
3. Is concise and easy to read (2-3 paragraphs max)
4. Uses natural language, not technical jargon
5. Focuses on what matters most for a homebuyer
6. Only mentions data that is actually available - skip any categories where data was unavailable

Format the response as plain text, no markdown.`;
    }

    console.log(`[Gemini] Prompt length: ${prompt.length} characters`);
    console.log(`[Gemini] Prompt preview (first 200 chars): ${prompt.substring(0, 200)}...`);

    // Use Gemini 2.5 Flash (1.5-flash was shut down in Sept 2025)
    // Try different model variations and API versions
    const modelVariations = [
      "gemini-3-pro-preview"
    ];
    const apiVersions = ["v1beta", "v1"];
    let lastError = null;
    
    for (const model of modelVariations) {
      for (const version of apiVersions) {
        try {
          console.log(`[Gemini] Trying model: ${model} with API version: ${version}`);
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
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 4096, // Increased for longer summaries
              }
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.warn(`[Gemini] Model ${model} with ${version} failed:`, response.status, errorText);
            lastError = new Error(`Gemini API error: ${response.status} ${errorText}`);
            continue; // Try next API version
          }

          const result = await response.json();
          console.log(`[Gemini] API response received from ${model} (${version})`);
          console.log(`[Gemini] Response structure keys:`, Object.keys(result));
          console.log(`[Gemini] Response preview:`, JSON.stringify(result).substring(0, 500));
          
          // Check for finish reason to see if response was truncated
          const finishReason = result.candidates?.[0]?.finishReason;
          if (finishReason) {
            console.log(`[Gemini] Finish reason: ${finishReason}`);
            if (finishReason === 'MAX_TOKENS' || finishReason === 'LENGTH') {
              console.warn(`[Gemini] Response was truncated due to token limit. Consider increasing maxOutputTokens.`);
            }
          }
          
          // Extract text from Gemini response - handle different response structures
          let text = null;
          
          // Try different response structures - check for multiple parts
          if (result.candidates?.[0]?.content?.parts) {
            // Concatenate all text parts
            text = result.candidates[0].content.parts
              .map(part => part.text)
              .filter(Boolean)
              .join('');
            console.log(`[Gemini] Found text in: result.candidates[0].content.parts (${result.candidates[0].content.parts.length} parts)`);
          } else if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
            text = result.candidates[0].content.parts[0].text;
            console.log(`[Gemini] Found text in: result.candidates[0].content.parts[0].text`);
          } else if (result.candidates?.[0]?.text) {
            text = result.candidates[0].text;
            console.log(`[Gemini] Found text in: result.candidates[0].text`);
          } else if (result.text) {
            text = result.text;
            console.log(`[Gemini] Found text in: result.text`);
          } else if (result.content?.parts?.[0]?.text) {
            text = result.content.parts[0].text;
            console.log(`[Gemini] Found text in: result.content.parts[0].text`);
          } else {
            console.error(`[Gemini] Unexpected response structure from ${model} (${version}):`);
            console.error(`[Gemini] Full response:`, JSON.stringify(result, null, 2));
            lastError = new Error("Unexpected Gemini API response structure");
            continue; // Try next API version
          }

          if (!text || text.trim().length === 0) {
            lastError = new Error("Gemini returned empty response");
            continue; // Try next API version
          }

          console.log(`[Gemini] Summary generated successfully using ${model} (${version}), length: ${text.length} characters`);
          console.log(`[Gemini] Summary preview (first 200 chars): ${text.substring(0, 200)}...`);
          return {
            summary: text.trim(),
            model: model,
            apiVersion: version,
          };
        } catch (versionErr) {
          console.warn(`[Gemini] Model ${model} with ${version} error:`, versionErr.message);
          lastError = versionErr;
          continue; // Try next API version
        }
      }
    }
    
    // If all API versions failed, throw the last error
    if (lastError) {
      throw lastError;
    }
    throw new Error("No Gemini API versions available");
  } catch (err) {
    console.error("[Gemini] Error details:", err.message);
    console.error("[Gemini] Full error:", err);
    throw err;
  }
}

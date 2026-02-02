// Redfin Base API Service - calls RapidAPI to fetch real listings
import logger, { logApiCall, logApiResponse } from '../utils/logger.js';

const RAPIDAPI_HOST = 'redfin-base.p.rapidapi.com';

// Don't read at module load - read at function call time
const getApiKey = () => process.env.RAPIDAPI_KEY;

/**
 * Transform Redfin API response to our Home interface format
 * Redfin returns nested data structure with homeData containing property info
 */
const transformRedfinListing = (listing, index, location) => {
  // Handle nested structure - listing might be wrapped in homeData
  const home = listing.homeData || listing;

  // Extract address from addressInfo fields (proper API structure)
  let address = 'Unknown Address';
  if (home.addressInfo) {
    const streetLine = home.addressInfo.formattedStreetLine || '';
    const city = home.addressInfo.city || '';
    const state = home.addressInfo.state || '';
    const zip = home.addressInfo.zip || '';

    if (streetLine && city && state) {
      address = `${streetLine}, ${city}, ${state} ${zip}`.trim();
    } else if (streetLine) {
      address = streetLine;
    }
  } else if (home.address) {
    address = home.address;
  } else if (home.streetAddress) {
    address = home.streetAddress;
  }

  // Extract price from nested structure
  let price = null;
  if (home.priceInfo?.homePrice?.int64Value) {
    price = parseInt(home.priceInfo.homePrice.int64Value);
  } else if (home.priceInfo?.amount) {
    price = parseInt(home.priceInfo.amount);
  } else if (home.price) {
    price = home.price;
  }

  const beds = home.beds || 0;
  const baths = home.baths || 0;
  const sqft = home.sqftInfo?.amount ? parseInt(home.sqftInfo.amount) : (home.sqft || 0);
  
  // Property type - map enum to string
  const propertyTypeMap = {
    '1': 'House',
    '2': 'Condo',
    '3': 'Townhouse',
    '6': 'Condo',
    '8': 'Land',
  };
  const propertyType = propertyTypeMap[home.propertyType?.toString()] || 'Property';

  // Extract property URL from homeData for later image fetching
  const propertyPath = home.url || '';
  const redfinUrl = propertyPath && !propertyPath.startsWith('http')
    ? `https://www.redfin.com${propertyPath}`
    : propertyPath;

  // Build Redfin URL
  let listingUrl = redfinUrl || `https://www.redfin.com/search?location=${encodeURIComponent(location)}`;

  // Extract image URLs from the search response if available
  const imageUrls = [];

  // Check for photos/images in various possible locations
  if (home.photos && Array.isArray(home.photos)) {
    home.photos.forEach(photo => {
      const url = photo.url || photo.photoUrl || photo.photoUrls?.fullScreenPhotoUrl || photo.photoUrls?.nonFullScreenPhotoUrl;
      if (url) imageUrls.push(url);
    });
  }

  if (home.photoUrls && Array.isArray(home.photoUrls)) {
    home.photoUrls.forEach(url => {
      if (typeof url === 'string') imageUrls.push(url);
    });
  }

  if (home.primaryPhotoUrl) {
    imageUrls.push(home.primaryPhotoUrl);
  }

  if (home.mlsPhotos && Array.isArray(home.mlsPhotos)) {
    home.mlsPhotos.forEach(photo => {
      if (photo.url) imageUrls.push(photo.url);
    });
  }

  // Log first property for debugging
  if (index === 0) {
    console.log(`[Transform] First property debug:`);
    console.log(`  - Property ID: ${home.propertyId}`);
    console.log(`  - Address: ${address}`);
    console.log(`  - URL path from API: ${propertyPath}`);
    console.log(`  - Final listingUrl: ${listingUrl}`);
    console.log(`  - Final redfinUrl: ${redfinUrl}`);
    console.log(`  - Image URLs found in response: ${imageUrls.length}`);
    console.log(`  - Raw home keys:`, Object.keys(home));
    // Log any image-related fields
    const imageFields = Object.keys(home).filter(k =>
      k.toLowerCase().includes('photo') ||
      k.toLowerCase().includes('image') ||
      k.toLowerCase().includes('media')
    );
    if (imageFields.length > 0) {
      console.log(`  - Image-related fields:`, imageFields);
      imageFields.forEach(field => {
        console.log(`    - ${field}:`, JSON.stringify(home[field]).substring(0, 200));
      });
    }
  }

  return {
    id: home.propertyId?.toString() || `redfin-${index}`,
    title: `${beds} bed ${propertyType}`,
    price: price ? `$${price.toLocaleString()}` : 'Contact for price',
    address: address,
    description: `${beds} bed${beds !== 1 ? 's' : ''}, ${baths} bath${baths !== 1 ? 's' : ''} ${propertyType.toLowerCase()}${sqft ? ` - ${sqft.toLocaleString()} sq ft` : ''}`,
    imageUrl: imageUrls.length > 0 ? imageUrls[0] : null, // Use first image from search response, or null to trigger progressive loading
    images: imageUrls, // Use images from search response
    redfinUrl: redfinUrl, // URL for fetching property details and images
    listingUrl: listingUrl,
    specs: {
      beds: beds,
      baths: baths,
      sqft: sqft,
    },
    insightBullets: {
      style: propertyType,
      vibe: location,
      risk: 'Risk data will be enriched',
      safety: 'Safety data will be enriched',
      financials: price ? `~$${Math.round(price * 0.004).toLocaleString()}/month` : 'Contact for price',
      schools: 'School data will be enriched',
      hospitals: 'Hospital data will be enriched',
      transit: 'Transit data will be enriched',
      greenSpace: 'Green space data will be enriched',
    },
    matchInsights: [
      `${beds} bedroom${beds !== 1 ? 's' : ''}, ${baths} bathroom${baths !== 1 ? 's' : ''}`,
      sqft ? `${sqft.toLocaleString()} sq ft` : 'Square footage not available',
      price ? `Listed at $${price.toLocaleString()}` : 'Contact for pricing',
    ],
    analysis: {
      nature: `${location} area has parks and amenities`,
      commute: `Check commute options from ${location}`,
      safety: `Research ${location} neighborhood safety data`,
      schools: `Check local schools in ${location}`,
    },
  };
};

/**
 * Search for homes using Redfin Base API via RapidAPI
 * @param {Object} params - Search parameters
 * @param {string} params.location - Location to search (e.g., "Sunnyvale, CA")
 * @param {number} params.priceMin - Minimum price filter
 * @param {number} params.priceMax - Maximum price filter
 * @param {number} params.bedrooms - Minimum bedrooms
 * @param {number} params.bathrooms - Minimum bathrooms
 * @param {string} correlationId - Request correlation ID for tracking
 * @returns {Promise<Array>} Array of homes
 */
export const searchRedfinListings = async (params, correlationId = 'unknown') => {
  const RAPIDAPI_KEY = getApiKey();

  if (!RAPIDAPI_KEY) {
    logger.error('RAPIDAPI_KEY is not set', { correlationId });
    throw new Error('RAPIDAPI_KEY not configured');
  }

  try {
    // Destructure all possible parameters from mapped preferences
    const {
      location,
      limit = 10,
      // Legacy parameter names (for backward compatibility)
      priceMin,
      priceMax,
      bedrooms,
      bathrooms,
      // All other parameters will be passed through directly
      ...otherParams
    } = params;

    // Location is required
    if (!location || !location.trim()) {
      logger.error('Location is required for Redfin search', { correlationId });
      throw new Error('Location is required for search');
    }

    logger.info('Initiating Redfin API search', {
      correlationId,
      location,
      limit,
    });

    // Build query params - start with location and limit
    const queryParams = {
      location: location,
      limit: Math.min(limit, 10), // Cap at 10 for performance
    };

    // Handle legacy parameter names for backward compatibility
    if (priceMin && !otherParams.min_price) queryParams.min_price = priceMin;
    if (priceMax && !otherParams.max_price) queryParams.max_price = priceMax;
    if (bedrooms && !otherParams.min_beds) queryParams.min_beds = bedrooms;
    if (bathrooms && !otherParams.min_baths) queryParams.min_baths = bathrooms;

    // Add all other mapped parameters from redfinMappingService
    // These include: minPrice, maxPrice, numBeds, numBaths, homeType, pool, etc.
    Object.entries(otherParams).forEach(([key, value]) => {
      // Only include non-null, non-undefined values
      if (value !== null && value !== undefined && value !== '') {
        queryParams[key] = value;
      }
    });

    // Build URL
    const url = new URL(`https://${RAPIDAPI_HOST}/1.0/redfin/search/location/for-sale`);
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
      },
    };

    // Log API call
    logApiCall(url.toString(), 'GET', {
      correlationId,
      queryParams,
      host: RAPIDAPI_HOST,
    });

    const apiStartTime = Date.now();
    const response = await fetch(url.toString(), options);
    const apiDuration = Date.now() - apiStartTime;

    // Log API response
    logApiResponse(url.toString(), 'GET', response.status, {
      correlationId,
      duration: `${apiDuration}ms`,
      headers: Object.fromEntries(response.headers.entries()),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Redfin API error', {
        correlationId,
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText.substring(0, 500),
        url: url.toString(),
        duration: `${apiDuration}ms`,
      });
      throw new Error(`Redfin API error: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    // Parse response
    let data;
    let responseText;
    try {
      responseText = await response.text();
      logger.debug('Redfin API response received', {
        correlationId,
        bodyLength: responseText.length,
        preview: responseText.substring(0, 200),
      });

      data = JSON.parse(responseText);
    } catch (parseError) {
      logger.error('Failed to parse Redfin API response', {
        correlationId,
        error: parseError.message,
        responsePreview: responseText ? responseText.substring(0, 500) : 'Unable to read response',
      });
      throw new Error(`Failed to parse Redfin API response: ${parseError.message}`);
    }

    // Log response structure
    logger.debug('Redfin API response parsed', {
      correlationId,
      responseType: typeof data,
      keys: Object.keys(data || {}),
    });

    // Check for error messages in successful response
    if (data.error || data.message || data.errors) {
      logger.warn('Redfin API returned error in response body', {
        correlationId,
        error: data.error || data.message || data.errors,
      });
    }

    // Redfin API returns data in a nested structure
    if (!data || (!Array.isArray(data) && !data.data)) {
      logger.warn('Unexpected Redfin API response format', {
        correlationId,
        response: JSON.stringify(data, null, 2).substring(0, 500),
      });
      return [];
    }

    // Extract array from either root level or data.data
    let listings = Array.isArray(data) ? data : (data.data || []);

    if (listings.length === 0) {
      logger.warn('No listings returned from Redfin API', {
        correlationId,
        queryParams,
        fullResponse: JSON.stringify(data, null, 2).substring(0, 1000),
      });
    } else {
      logger.info('Listings retrieved from Redfin API', {
        correlationId,
        totalReturned: listings.length,
        limitApplied: limit,
      });
    }
    
    // Transform results to our Home interface format - only slice limit amount
    const transformedListings = listings
      .slice(0, limit)
      .map((listing, index) => {
        try {
          const transformed = transformRedfinListing(listing, index, location);
          if (index === 0) {
            logger.debug('First listing transformed', {
              correlationId,
              transformed: JSON.stringify(transformed, null, 2).substring(0, 400),
            });
          }
          return transformed;
        } catch (transformError) {
          logger.error('Error transforming listing', {
            correlationId,
            index,
            error: transformError.message,
            listingData: JSON.stringify(listing, null, 2).substring(0, 500),
          });
          // Return a fallback listing instead of crashing
          return {
            id: `redfin-error-${index}`,
            title: 'Property',
            price: 'Contact for price',
            address: 'Address unavailable',
            description: 'Listing data unavailable',
            imageUrl: null,
            images: [],
            redfinUrl: '',
            listingUrl: `https://www.redfin.com/search?location=${encodeURIComponent(location)}`,
            specs: { beds: 0, baths: 0, sqft: 0 },
            insightBullets: {
              style: 'Unknown',
              vibe: location,
              risk: 'Unknown',
              safety: 'Unknown',
              financials: 'Unknown',
              schools: 'Unknown',
              hospitals: 'Unknown',
              transit: 'Unknown',
              greenSpace: 'Unknown'
            },
            matchInsights: ['Listing data unavailable'],
            analysis: { nature: 'Unknown', commute: 'Unknown', safety: 'Unknown', schools: 'Unknown' },
          };
        }
      })
      .filter(Boolean); // Remove any null/undefined entries

    if (transformedListings.length === 0) {
      logger.warn('No valid listings after transformation', {
        correlationId,
        originalCount: listings.length,
      });
      return [];
    }

    logger.info('Successfully transformed listings', {
      correlationId,
      transformedCount: transformedListings.length,
    });

    // Fetch images for all properties in parallel
    logger.info('Fetching images for all properties', {
      correlationId,
      propertiesCount: transformedListings.length,
    });

    const imageStartTime = Date.now();
    const imagePromises = transformedListings.map(async (home, index) => {
      // Skip if no redfinUrl or if images already present (from search response)
      if (!home.redfinUrl || home.images.length > 0) {
        return home;
      }

      try {
        console.log(`[Images] Fetching images for property ${index + 1}/${transformedListings.length}: ${home.redfinUrl}`);
        const photoUrls = await getPropertyDetails(home.redfinUrl);

        // Limit to max 10 images
        const limitedImages = photoUrls.slice(0, 10);

        return {
          ...home,
          images: limitedImages,
          imageUrl: limitedImages.length > 0 ? limitedImages[0] : null,
        };
      } catch (error) {
        console.error(`[Images] Failed to fetch images for property ${index + 1}:`, error.message);
        // Return home without images - frontend will show loading state
        return home;
      }
    });

    const homes = await Promise.all(imagePromises);
    const imageDuration = Date.now() - imageStartTime;

    logger.info('Image fetching complete', {
      correlationId,
      duration: `${imageDuration}ms`,
      propertiesWithImages: homes.filter(h => h.images.length > 0).length,
      totalProperties: homes.length,
    });

    return homes;
  } catch (error) {
    logger.error('Error in searchRedfinListings', {
      correlationId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Extract photo URLs from Redfin detail API response
 * @param {Object} data - Redfin detail API response
 * @returns {Array<string>} Array of photo URLs
 */
const extractPhotoUrls = (data) => {
  const urls = [];

  // Try to find photos array in the response
  // Based on sample response: data.data.aboveTheFold.mediaBrowserInfo.photos
  let photos = [];

  // Navigate to photos array - could be in different locations
  if (data?.data?.aboveTheFold?.mediaBrowserInfo?.photos) {
    photos = data.data.aboveTheFold.mediaBrowserInfo.photos;
  } else if (data?.aboveTheFold?.mediaBrowserInfo?.photos) {
    photos = data.aboveTheFold.mediaBrowserInfo.photos;
  } else if (data?.mediaBrowserInfo?.photos) {
    photos = data.mediaBrowserInfo.photos;
  } else if (Array.isArray(data?.photos)) {
    photos = data.photos;
  }

  console.log(`[ExtractPhotos] Found ${photos.length} photo objects`);

  // Extract URLs from each photo object
  // Each photo has: photoUrls.fullScreenPhotoUrl, photoUrls.nonFullScreenPhotoUrl, etc.
  for (const photo of photos) {
    if (photo?.photoUrls) {
      // Prefer full screen photo URL for best quality
      const url = photo.photoUrls.fullScreenPhotoUrl
                  || photo.photoUrls.nonFullScreenPhotoUrl
                  || photo.photoUrls.nonFullScreenPhotoUrlCompressed;

      if (url) {
        urls.push(url);
      }
    }
  }

  console.log(`[ExtractPhotos] Extracted ${urls.length} photo URLs`);

  return urls;
};

/**
 * Fetch detailed property information including real images
 * @param {string} redfinUrl - Full Redfin URL (e.g., "https://www.redfin.com/NY/New-York/...")
 * @returns {Promise<Array<string>>} Array of photo URLs
 */
export const getPropertyDetails = async (redfinUrl) => {
  const RAPIDAPI_KEY = getApiKey();

  if (!RAPIDAPI_KEY) {
    console.error('❌ RAPIDAPI_KEY is not set');
    throw new Error('RAPIDAPI_KEY not configured');
  }

  if (!redfinUrl) {
    throw new Error('redfinUrl is required');
  }

  try {
    console.log(`🖼️ Fetching property details for: ${redfinUrl}`);

    const url = new URL(`https://${RAPIDAPI_HOST}/redfin/detail-url`);
    url.searchParams.append('url', redfinUrl);

    const options = {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
      },
    };

    console.log(`📡 Calling Redfin detail API: ${url.toString()}`);

    const response = await fetch(url.toString(), options);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Redfin detail API error: ${response.status} ${errorText}`);
      throw new Error(`Redfin detail API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`📦 Redfin detail API response received`);

    // Extract all photoUrls from response
    const photoUrls = extractPhotoUrls(data);

    if (photoUrls.length === 0) {
      console.warn('⚠️ No photoUrls found in property details');
      console.warn('⚠️ Response structure:', JSON.stringify(data, null, 2).substring(0, 500));
    } else {
      console.log(`✅ Found ${photoUrls.length} photo URLs for property`);
    }

    return photoUrls;
  } catch (error) {
    console.error('❌ Error fetching property details:', error.message);
    throw error;
  }
};

export default {
  searchRedfinListings,
  getPropertyDetails,
  extractPhotoUrls,
};

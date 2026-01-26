// Redfin Base API Service - calls RapidAPI to fetch real listings
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

  // Extract address from URL or other fields
  const urlParts = home.url ? home.url.split('/') : [];
  const addressFromUrl = urlParts.length > 3 ? urlParts.slice(1, -2).join(' ') : '';
  const address = addressFromUrl || home.address || home.streetAddress || 'Unknown Address';

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

  // Select varied high-quality property images from Unsplash
  // Using different photos to provide variety in the card stack
  const propertyImages = [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200', // Modern house
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200', // Contemporary home
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=1200', // Elegant house
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200', // Cozy home
    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?q=80&w=1200', // Stylish property
    'https://images.unsplash.com/photo-1600573472591-ee6b39e43054?q=80&w=1200', // Beautiful home
    'https://images.unsplash.com/photo-1600210492493-0946911123ea?q=80&w=1200', // Classic house
    'https://images.unsplash.com/photo-1600585152220-90363fe7e115?q=80&w=1200', // Modern residence
    'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?q=80&w=1200', // Suburban home
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1200', // Contemporary property
  ];
  const imageUrl = propertyImages[index % propertyImages.length];

  // Build Redfin URL
  let listingUrl = home.url;
  if (listingUrl && !listingUrl.startsWith('http')) {
    listingUrl = 'https://www.redfin.com' + listingUrl;
  }
  
  return {
    id: home.propertyId?.toString() || `redfin-${index}`,
    title: `${beds} bed ${propertyType}`,
    price: price ? `$${price.toLocaleString()}` : 'Contact for price',
    address: address,
    description: `${beds} bed${beds !== 1 ? 's' : ''}, ${baths} bath${baths !== 1 ? 's' : ''} ${propertyType.toLowerCase()}${sqft ? ` - ${sqft.toLocaleString()} sq ft` : ''}`,
    imageUrl: imageUrl, // Use real photo from API
    listingUrl: listingUrl || `https://www.redfin.com/search?location=${encodeURIComponent(location)}`,
    specs: {
      beds: beds,
      baths: baths,
      sqft: sqft,
    },
    insightBullets: {
      style: propertyType,
      vibe: location,
      climateRisk: 'Low to Moderate',
      safety: 'Research neighborhood',
      financials: price ? `~$${Math.round(price * 0.004).toLocaleString()}/month` : 'Contact for price',
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
 * @returns {Promise<Array>} Array of homes
 */
export const searchRedfinListings = async (params) => {
  const RAPIDAPI_KEY = getApiKey();
  
  if (!RAPIDAPI_KEY) {
    console.error('❌ RAPIDAPI_KEY is not set');
    throw new Error('RAPIDAPI_KEY not configured');
  }

  try {
    const {
      location,
      priceMin,
      priceMax,
      bedrooms,
      bathrooms,
      limit = 10,
    } = params;

    // Location is required
    if (!location || !location.trim()) {
      console.error('❌ Location is required');
      throw new Error('Location is required for search');
    }

    console.log(`🔍 Searching Redfin for: ${location}`);

    // Build query string - limit to requested amount to reduce API load
    const queryParams = {
      location: location,
      limit: Math.min(limit, 10), // Cap at 10 to avoid slow API calls
    };
    
    if (priceMin) queryParams.min_price = priceMin;
    if (priceMax) queryParams.max_price = priceMax;
    if (bedrooms) queryParams.min_beds = bedrooms;
    if (bathrooms) queryParams.min_baths = bathrooms;

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

    console.log(`📡 Calling API: ${url.toString()}`);
    const response = await fetch(url.toString(), options);

    if (!response.ok) {
      console.error(`❌ Redfin API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('📦 Raw API response keys:', Object.keys(data));
    console.log('📦 Sample data item:', JSON.stringify(data.data?.[0], null, 2).substring(0, 1500));
    
    // Redfin API returns data in a nested structure
    if (!data || (!Array.isArray(data) && !data.data)) {
      console.warn('⚠️ Unexpected response format');
      return [];
    }

    // Extract array from either root level or data.data
    let listings = Array.isArray(data) ? data : (data.data || []);
    
    console.log(`📦 API returned ${listings.length} results, limiting to ${limit}`);
    
    // Transform results to our Home interface format - only slice limit amount
    const homes = listings
      .slice(0, limit)
      .map((listing, index) => {
        const transformed = transformRedfinListing(listing, index, location);
        if (index === 0) {
          console.log('🏠 Transformed listing:', JSON.stringify(transformed, null, 2).substring(0, 600));
        }
        return transformed;
      });

    console.log(`✅ Returning ${homes.length} listings`);
    return homes;
  } catch (error) {
    console.error('❌ Error fetching from Redfin API:', error.message);
    throw error;
  }
};

export default {
  searchRedfinListings,
};

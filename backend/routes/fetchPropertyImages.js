// Route for on-demand property image fetching
import express from 'express';
import { getPropertyDetails } from '../services/redfin Service.js';

const router = express.Router();

/**
 * POST /api/fetch-property-images
 * Fetch property images and enriched data on-demand for progressive loading
 *
 * Request body:
 * {
 *   "redfinUrl": "https://www.redfin.com/NY/New-York/69-E-130th-St-10037/unit-2A/home/45139008"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "images": ["url1", "url2", ...], // Empty array if no images available
 *   "enrichedData": {
 *     "schools": "School insight string",
 *     "transit": "Transit insight string",
 *     "amenities": "Amenity insight string",
 *     "financials": "Financial insight string",
 *     "style": "Style insight string"
 *   }
 * }
 */
router.post('/api/fetch-property-images', async (req, res) => {
  const { redfinUrl } = req.body;

  // Validate request
  if (!redfinUrl) {
    return res.status(400).json({
      success: false,
      error: 'redfinUrl is required',
      images: []
    });
  }

  try {
    console.log(`[FetchImages] Fetching images and enriched data for property: ${redfinUrl}`);

    // Call Redfin detail API to get property details with images and enriched data
    const propertyData = await getPropertyDetails(redfinUrl);

    // Extract photos and enrichedData from response
    const { photos, enrichedData } = propertyData;

    // Check if we got any images
    if (!photos || photos.length === 0) {
      console.warn(`[FetchImages] No images found for property`);
      return res.json({
        success: true,
        images: [],
        enrichedData: enrichedData || {}
      });
    }

    console.log(`[FetchImages] Successfully fetched ${photos.length} images`);
    console.log(`[FetchImages] Enriched data:`, enrichedData);

    // Limit to max 10 images per card to avoid overwhelming the UI
    const limitedImages = photos.slice(0, 10);

    if (photos.length > 10) {
      console.log(`[FetchImages] Limited from ${photos.length} to 10 images`);
    }

    return res.json({
      success: true,
      images: limitedImages,
      enrichedData: enrichedData || {}
    });

  } catch (error) {
    console.error('[FetchImages] Error fetching property images:', error.message);
    console.error('[FetchImages] Error details:', error);

    // Return empty array on error - frontend will display "no images available"
    return res.json({
      success: false,
      error: error.message,
      images: [],
      enrichedData: {}
    });
  }
});

export default router;

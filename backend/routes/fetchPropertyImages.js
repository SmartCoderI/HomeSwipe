// Route for on-demand property image fetching
import express from 'express';
import { getPropertyDetails } from '../services/redfin Service.js';

const router = express.Router();

/**
 * POST /api/fetch-property-images
 * Fetch property images on-demand for progressive loading
 *
 * Request body:
 * {
 *   "redfinUrl": "https://www.redfin.com/NY/New-York/69-E-130th-St-10037/unit-2A/home/45139008"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "images": ["url1", "url2", ...] // Empty array if no images available
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
    console.log(`[FetchImages] Fetching images for property: ${redfinUrl}`);

    // Call Redfin detail API to get property details with images
    const photoUrls = await getPropertyDetails(redfinUrl);

    // Check if we got any images
    if (!photoUrls || photoUrls.length === 0) {
      console.warn(`[FetchImages] No images found for property`);
      return res.json({
        success: true,
        images: []
      });
    }

    console.log(`[FetchImages] Successfully fetched ${photoUrls.length} images`);

    // Limit to max 10 images per card to avoid overwhelming the UI
    const limitedImages = photoUrls.slice(0, 10);

    if (photoUrls.length > 10) {
      console.log(`[FetchImages] Limited from ${photoUrls.length} to 10 images`);
    }

    return res.json({
      success: true,
      images: limitedImages
    });

  } catch (error) {
    console.error('[FetchImages] Error fetching property images:', error.message);
    console.error('[FetchImages] Error details:', error);

    // Return empty array on error - frontend will display "no images available"
    return res.json({
      success: false,
      error: error.message,
      images: []
    });
  }
});

export default router;

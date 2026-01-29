# Redfin API Image Issue

## Problem

The Redfin API (via RapidAPI) is not returning property images in the search results.

## Current Image Extraction Logic

The code checks for images in these fields:
- `photos` (array)
- `images` (array)
- `photoUrls` (array)
- `primaryPhoto` (object or string)
- `photo` (object or string)
- `imageUrl` (string)
- `media.photos` (nested)
- `photoInfo.url` (nested)
- `homeData.photos` (nested in homeData)

## Why Images Might Not Be Available

1. **API Response Structure**: The Redfin Base API via RapidAPI might not include image URLs in the search endpoint response
2. **Separate Endpoint**: Images might require a separate API call using the property ID
3. **API Limitations**: The free/basic tier might not include image data
4. **Different Field Names**: Images might be in a field we're not checking

## Debugging Steps

When you run a search, check the backend console logs for:

1. **Image field check logs**: 
   ```
   📸 Image field check for listing 0: photos: undefined, images: undefined, ...
   ```

2. **Available fields in response**:
   ```
   📦 Sample listing structure: {...}
   📸 Checking for image fields in first listing:
      - photos: ...
      - images: ...
   ```

3. **Listing structure keys**:
   ```
   Listing structure keys: id, address, price, ...
   ```

## Potential Solutions

### Option 1: Check Redfin API Documentation
- Review RapidAPI Redfin Base API documentation
- Look for image-related endpoints or parameters
- Check if images require a separate API call

### Option 2: Use Property ID to Fetch Images
- If property ID is available, make a separate API call
- Endpoint might be: `/property/{propertyId}/photos` or similar

### Option 3: Scrape from Redfin URL
- Use the `listingUrl` to scrape images (not recommended, violates ToS)
- Only if Redfin allows it

### Option 4: Use Redfin's Public Image URLs
- Redfin might have a pattern for image URLs based on property ID
- Example: `https://ssl.cdn-redfin.com/photo/[propertyId]/[imageId].jpg`

### Option 5: Keep Fallback Images
- Continue using Unsplash fallback images
- This is acceptable if Redfin API doesn't provide images

## Current Fallback

If no Redfin image is found, the code uses Unsplash stock photos as fallback. This is acceptable but not ideal.

## Next Steps

1. **Check API Response**: Look at the actual API response structure in logs
2. **Review RapidAPI Docs**: Check if there's an image endpoint
3. **Test with Property ID**: Try fetching images using property ID if available
4. **Contact RapidAPI Support**: Ask about image availability in the API

## Logging

The code now logs:
- Which image fields were checked
- What fields exist in the response
- Whether a Redfin image was found or fallback was used

Check backend console when running searches to see what's actually in the API response.

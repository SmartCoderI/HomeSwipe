
import { Home } from './types';

export const mockHomes: Home[] = [
  {
    id: "1",
    title: "Modern loft with high ceilings",
    price: "$1,998,000",
    address: "1122 Vasquez Ave, Sunnyvale, CA 94086",
    description: "Stunning modern loft featuring high ceilings, open floor plan, and premium finishes throughout. Located in the heart of Sunnyvale with easy access to tech campuses.",
    imageUrl: "https://photos.zillowstatic.com/fp/c9282436eb91b715fcba27d6dde03692-cc_ft_1536.webp",
    listingUrl: "https://www.zillow.com/homedetails/1122-Vasquez-Ave-Sunnyvale-CA-94086/19519571_zpid/",
    specs: {
      beds: 3,
      baths: 2,
      sqft: 1372
    },
    insightBullets: {
      style: "Modern minimalist with industrial touches",
      vibe: "Urban chic, perfect for tech professionals",
      risk: "Flood Zone X (minimal risk), Fire hazard: Low, No Superfund sites nearby, No nearby earthquake faults",
      safety: "Very safe - gated community, 24/7 security. Crime rate 40% below national average",
      financials: "Property tax ~$9K/year, HOA $350/month",
      schools: "Cherry Chase Elementary (9/10) - 0.5 miles, Sunnyvale Middle (8/10) - 1.2 miles",
      hospitals: "El Camino Hospital - 2.3 miles, Stanford Health Care - 8 miles",
      transit: "Sunnyvale Caltrain - 5 min walk, VTA Light Rail - 10 min walk",
      greenSpace: "Ortega Park - 0.3 miles, Baylands Park - 2 miles"
    },
    matchInsights: [
      "5 min walk to Sunnyvale Caltrain station",
      "3 min drive to Apple Park",
      "Walk Score: 92 - Very walkable"
    ],
    analysis: {
      nature: "Nearby parks: Ortega Park (0.3 miles), Baylands Park (2 miles)",
      commute: "15 min to Mountain View, 20 min to Palo Alto via 101",
      safety: "Crime rate 40% below national average",
      schools: "Top-rated schools: Cherry Chase Elementary (9/10)"
    }
  },
  {
    id: "2",
    title: "Cozy Craftsman with backyard",
    price: "$1,125,000",
    address: "456 Oak Avenue, Sunnyvale, CA 94086",
    description: "Charming Craftsman home with beautifully maintained backyard. Perfect for families seeking character and space in a quiet neighborhood.",
    imageUrl: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=800",
    listingUrl: "https://www.zillow.com/homes/456-Oak-Ave-Sunnyvale-CA-94086_rb/",
    specs: {
      beds: 4,
      baths: 3,
      sqft: 2400
    },
    insightBullets: {
      style: "Classic Craftsman with modern updates",
      vibe: "Family-friendly, quiet suburban feel",
      risk: "Flood Zone X (minimal risk), Fire hazard: Low, No Superfund sites nearby, Liquefaction zone: Not identified",
      safety: "Excellent - family neighborhood, active community watch. One of safest neighborhoods in Sunnyvale",
      financials: "Property tax ~$11K/year, No HOA",
      schools: "Bishop Elementary (10/10) - 0.3 miles, Sunnyvale High (9/10) - 1.5 miles",
      hospitals: "El Camino Hospital - 3.1 miles, Kaiser Permanente - 4.2 miles",
      transit: "VTA Bus Stop - 2 min walk, Sunnyvale Caltrain - 12 min drive",
      greenSpace: "Washington Park - 10 min walk, Las Palmas Park - 0.8 miles"
    },
    matchInsights: [
      "10 min walk to Washington Park",
      "8 min drive to Google campus",
      "Great schools within walking distance"
    ],
    analysis: {
      nature: "Large fenced backyard, mature trees, gardening space",
      commute: "12 min to Google, 18 min to Facebook via 237",
      safety: "One of safest neighborhoods in Sunnyvale",
      schools: "Excellent schools: Bishop Elementary (10/10)"
    }
  },
  {
    id: "3",
    title: "Contemporary townhouse with garage",
    price: "$789,000",
    address: "789 Maple Drive, Sunnyvale, CA 94089",
    description: "Newly renovated contemporary townhouse with attached 2-car garage. Modern amenities in a convenient location near shopping and transit.",
    imageUrl: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=800",
    listingUrl: "https://www.zillow.com/homes/789-Maple-Dr-Sunnyvale-CA-94089_rb/",
    specs: {
      beds: 2,
      baths: 2.5,
      sqft: 1650
    },
    insightBullets: {
      style: "Sleek contemporary with smart home features",
      vibe: "Modern urban living, low maintenance",
      risk: "Flood Zone X (minimal risk), Fire hazard: Very low, No Superfund sites within 10 miles, No nearby faults",
      safety: "Secure building access, well-lit parking. Gated community with security cameras",
      financials: "Property tax ~$8K/year, HOA $420/month",
      schools: "Cumberland Elementary (8/10) - 0.6 miles, Cupertino High (9/10) - 3.2 miles",
      hospitals: "El Camino Hospital - 1.8 miles, Stanford Health Care - 9 miles",
      transit: "Sunnyvale Caltrain - 7 min walk, VTA Light Rail - 5 min walk",
      greenSpace: "Las Palmas Park - 0.5 miles, Sunnyvale Baylands - 3.2 miles"
    },
    matchInsights: [
      "2 min walk to Whole Foods and coffee shops",
      "7 min to Sunnyvale Caltrain",
      "Pet-friendly community with dog park"
    ],
    analysis: {
      nature: "Nearby: Las Palmas Park (0.5 miles), recreational facilities",
      commute: "Easy access to 101, 237, and 280 freeways",
      safety: "Gated community with security cameras",
      schools: "Good schools nearby: Cumberland Elementary (8/10)"
    }
  },
  {
    id: "4",
    title: "Luxury condo with mountain views",
    price: "$1,450,000",
    address: "321 Hillcrest Road, Sunnyvale, CA 94087",
    description: "Stunning luxury condo with panoramic mountain views. High-end finishes, spacious layout, and premium amenities in prestigious location.",
    imageUrl: "https://images.unsplash.com/photo-1600607687644-c7171b42498b?q=80&w=800",
    listingUrl: "https://www.zillow.com/homes/321-Hillcrest-Rd-Sunnyvale-CA-94087_rb/",
    specs: {
      beds: 3,
      baths: 2.5,
      sqft: 2200
    },
    insightBullets: {
      style: "Luxury modern with premium materials",
      vibe: "Upscale living, concierge service available",
      risk: "Flood Zone X (minimal risk), Fire hazard: Moderate (hillside area), No Superfund sites nearby, 2 faults within 5 miles",
      safety: "High-end security system, secure parking garage. Top-tier security with 24/7 surveillance",
      financials: "Property tax ~$14.5K/year, HOA $680/month",
      schools: "San Miguel Elementary (10/10) - 0.4 miles, Homestead High (9/10) - 2.1 miles",
      hospitals: "El Camino Hospital - 2.8 miles, Stanford Health Care - 7.5 miles",
      transit: "VTA Light Rail - 8 min drive, Sunnyvale Caltrain - 15 min drive",
      greenSpace: "Rooftop terrace access, Santa Cruz Mountain views. Rancho San Antonio - 4 miles"
    },
    matchInsights: [
      "12 min drive to Apple Infinite Loop",
      "15 min to Stanford University",
      "Elevator building with fitness center"
    ],
    analysis: {
      nature: "Scenic views of Santa Cruz mountains, rooftop terrace access",
      commute: "Prime location between Apple, Google, and Meta campuses",
      safety: "Top-tier security, gated complex with 24/7 surveillance",
      schools: "Premier schools: San Miguel Elementary (10/10)"
    }
  },
  {
    id: "5",
    title: "Charming bungalow near downtown",
    price: "$975,000",
    address: "654 Birch Lane, Sunnyvale, CA 94086",
    description: "Adorable renovated bungalow just blocks from downtown Sunnyvale. Perfect blend of historic charm and modern convenience.",
    imageUrl: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=800",
    listingUrl: "https://www.zillow.com/homes/654-Birch-Ln-Sunnyvale-CA-94086_rb/",
    specs: {
      beds: 3,
      baths: 2,
      sqft: 1750
    },
    insightBullets: {
      style: "Charming bungalow with vintage character",
      vibe: "Walkable urban neighborhood, close to amenities",
      risk: "Flood Zone X (minimal risk), Fire hazard: Low, No Superfund sites nearby, No nearby faults identified",
      safety: "Safe neighborhood, well-maintained streets. Active neighborhood watch, family-oriented community",
      financials: "Property tax ~$9.7K/year, No HOA",
      schools: "San Miguel Elementary (9/10) - 0.2 miles, Fremont High (8/10) - 1.8 miles",
      hospitals: "El Camino Hospital - 2.5 miles, Kaiser Permanente - 3.8 miles",
      transit: "Caltrain station - 8 min walk, VTA Bus - 3 min walk",
      greenSpace: "Community gardens nearby, Tree-lined streets. Washington Park - 0.6 miles"
    },
    matchInsights: [
      "5 min walk to downtown Sunnyvale restaurants",
      "8 min walk to Caltrain station",
      "Steps from farmers market on weekends"
    ],
    analysis: {
      nature: "Tree-lined streets, community gardens nearby",
      commute: "Excellent transit access, bike-friendly routes to tech campuses",
      safety: "Active neighborhood watch, family-oriented community",
      schools: "Strong schools: San Miguel Elementary (9/10)"
    }
  }
];

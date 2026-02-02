
import { Home } from './types';

export const mockHomes: Home[] = [
  {
    id: "1",
    title: "East San Jose Starter Home with Highway Access",
    price: "$950,000",
    address: "1616 Waverly Ave, San Jose, CA 95122",
    description: "Affordable East San Jose single-family home offering urban convenience, low environmental risk, and fast access to highways and downtown.",
    imageUrl: "https://ssl.cdn-redfin.com/photo/45/bigphoto/082/CV25277082_0.jpg",
    listingUrl: "https://www.redfin.com/CA/San-Jose/1616-Waverly-Ave-95122/home/1703532",
    specs: {
      beds: 3,
      baths: 2,
      sqft: 1094
    },
    insightBullets: {
      style: "Traditional single-family home with practical interior updates",
      vibe: "Urban residential, value-focused living with city convenience",
      risk: "Flood Zone D (outside SFHA, minimal flood risk), Low fire hazard, Standard Bay Area seismic exposure with no known nearby faults",
      safety: "Crime profile below city average",
      financials: "Property tax ~$990/month, HOA $0/month",
      schools: "William C. Overfelt High School (3/10), ~0.5 miles, schools are generally lower-rated compared to West Valley areas",
      hospitals: "Regional Medical Center of San Jose (rating 3.9, 2.0 mi), Fresenius Medical Care at Regional Medical Center (2.8 mi), Dr. Hidhi D. Sikka, DDS (rating 4.8, 2.8 mi)",
      transit: "Capitol Caltrain Station ~2.2 miles; VTA bus routes nearby; quick access to US-101, I-280, and Capitol Expressway",
      greenSpace: "Welch Park ~0.7 mi; Municipal Rose Garden ~5.4 miles for larger regional green space"
    },
    matchInsights: [
      "Lower-cost entry into San Jose single-family homeownership",
      "Well-suited for buyers prioritizing commute flexibility over school rankings",
      "Practical urban living"
    ],
    analysis: {
      nature: "Urban neighborhood with access to local parks and recreational facilities within a short drive",
      commute: "Quick access to Highway 101 and Capitol Expressway; ~10–15 minutes to Downtown San Jose depending on traffic",
      safety: "Higher crime exposure than West Valley neighborhoods, consistent with central East San Jose patterns",
      schools: "Assigned schools are generally low-rated overall"
    }
  },
  {
    id: "2",
    title: "Cul-de-Sac Home Near East Foothills",
    price: "$998,000",
    address: "366 Cureton Pl, San Jose, CA 95127",
    description: "Single-Family Home on Quiet Cul-de-Sac in East San Jose Foothills",
    imageUrl: "https://ssl.cdn-redfin.com/photo/8/mbpaddedwide/643/genMid.ML82032643_1_0.jpg",
    additionalImages: [
  "https://ssl.cdn-redfin.com/photo/8/bigphoto/643/ML82032643_6_0.jpg",
  "https://ssl.cdn-redfin.com/photo/8/bigphoto/643/ML82032643_0.jpg"
],
    listingUrl: "https://www.redfin.com/CA/San-Jose/366-Cureton-Pl-95127/home/921650",
    specs: {
      beds: 3,
      baths: 2,
      sqft: 1358
    },
    insightBullets: {
      style: "Traditional single-family home with a practical, no-frills layout",
      vibe: "Quiet residential living on a low-traffic cul-de-sac",
      risk: "Flood Zone X (area of minimal flood hazard), Low fire hazard, Standard Bay Area seismic exposure, No Superfund sites nearby",
      safety: "Crime profile stronger than many East San Jose areas",
      financials: "Property tax ~$12.4K/year, No HOA",
      schools: "James Lick High School (4/10) - 0.8 miles; schools are generally mid-to-lower rated compared to West San Jose",
      hospitals: "Inspire Behavioral Health (rating 4.9, 1.3 mi), Dr. Nidhi D. Sikka, DDS (rating 4.8, 1.7 mi), Bay Area Healthcare – Kashif Abdullah, MD, MPH (rating 4.5, 1.8 mi)",
      transit: "Berryessa / North San Jose BART Station ~3.2 miles; primarily car-based access to Capitol Expressway and US-101",
      greenSpace: "Alum Rock Park ~2.0 miles, offering regional hiking and open space"
    },
    matchInsights: [
      "Cul-de-sac location with reduced traffic and added privacy",
      "Closer proximity to East Foothills and Alum Rock Park compared to central East San Jose homes",
      "Balanced option for buyers seeking quieter residential living without West Valley pricing"
    ],
    analysis: {
      nature: "Residential neighborhood near the East Foothills with access to local parks and open space by car",
      commute: "Driving-based commute with access to Capitol Expressway, US-101, and downtown San Jose",
      safety: "Above-average crime ratings for the surrounding East San Jose area, enhanced by cul-de-sac layout",
      schools: "Schools in this area are generally rated on the lower to mid range compared to West San Jose"
    }
  },
  {
    id: "3",
    title: "Evergreen Home Near Foothills & Parks",
    price: "$1,248,000",
    address: "3279 Cuesta Dr, San Jose, CA 95148",
    description: "Well-Maintained Evergreen Home Near Foothills with Private Yard",
    imageUrl: "https://ssl.cdn-redfin.com/system_files/media/1187633_JPG/item_53.jpg",
    additionalImages: [
  "https://ssl.cdn-redfin.com/system_files/media/1187633_JPG/genLdpUgcMediaBrowserUrl/item_42.jpg",
  "https://ssl.cdn-redfin.com/system_files/media/1187633_JPG/genLdpUgcMediaBrowserUrl/item_8.jpg",
  "https://ssl.cdn-redfin.com/system_files/media/1187633_JPG/item_33.jpg"
],
    listingUrl: "https://www.redfin.com/CA/San-Jose/3279-Cuesta-Dr-95148/home/630176",
    specs: {
      beds: 3,
      baths: 2,
      sqft: 1495
    },
    insightBullets: {
      style: "Traditional single-family home with a practical, family-oriented layout",
      vibe: "Quiet suburban living in a well-established Evergreen neighborhood",
      risk: "Flood Zone D (outside SFHA, minimal flood risk), Low fire hazard, Standard Bay Area seismic exposure, No Superfund sites nearby",
      safety: "Strong safety profile than neighborhoods",
      financials: "Property tax ~$15.6K/year, no HOA",
      schools: "Mt. Pleasant High School (4/10), ~0.7 miles; school quality varies across Evergreen by grade level",
      hospitals: "San Jose Foothill Family Community Clinic (rating 4.3, 0.8 mi), Working Feet Clinic (rating 5.0, 2.5 mi), DaVita Tully Road Home Training (rating 4.0, 2.7 mi)",
      transit: "Capitol Caltrain Station ~4.2 miles; primarily car-dependent with access to Capitol Expressway and US-101 ",
      greenSpace: "Lake Cunningham Regional Park ~1.0 miles; Joseph D. Grant County Park ~4.2 miles; "
    },
    matchInsights: [
      "Larger lot and square footage compared to central San Jose homes",
      "Evergreen location with a quieter, suburban feel",
      "Good balance of space, neighborhood stability, and regional park access"
    ],
    analysis: {
      nature: "Foothill-adjacent environment with access to local parks and open space by car",
      commute: "riving-based commute via Capitol Expressway and Highway 101 to other parts of San Jose",
      safety: "One of the stronger safety profiles among East and South San Jose neighborhoods",
      schools: "Local schools are mixed, with ratings varying by grade level across the Evergreen area"
    }
  },
  /* school district*/ 
  {
    id: "4",
    title: "West Valley Home Near Cupertino High",
    price: "$2,598,000",
    address: "821 Raintree Dr, San Jose, CA 95129",
    description: "Quiet West Valley living with strong schools, low environmental risk, and convenient Silicon Valley access.",
    imageUrl: "https://ssl.cdn-redfin.com/photo/9/bigphoto/987/426095987_2.jpg",
    additionalImages: [
  "https://ssl.cdn-redfin.com/photo/9/bigphoto/987/426095987_3_1.jpg",
  "https://ssl.cdn-redfin.com/photo/9/bigphoto/987/426095987_6_1.jpg",
  "https://ssl.cdn-redfin.com/photo/9/bigphoto/987/426095987_18_1.jpg"
],
    listingUrl: "https://www.redfin.com/CA/San-Jose/821-Raintree-Dr-95129/home/801833",
    specs: {
      beds: 3,
      baths: 2,
      sqft: 1653
    },
    insightBullets: {
      style: "Classic single-story ranch with practical updates",
      vibe: "Quiet, established West Valley neighborhood with long-term residents",
      risk: "Flood Zone D (outside SFHA, minimal flood risk), Low fire hazard, No nearby earthquake faults or liquefaction zones, No Superfund sites within 10 miles",
      safety: "Calm residential streets",
      financials: "Estimated property tax ~$31.2K/year, HOA ~$0/month",
      schools: "Cupertino High (10/10, 1.0 mi)",
      hospitals: "Kaiser Permanente San Jose (1.3 mi), Kaiser Santa Clara (1.6 mi), plus multiple regional medical centers",
      transit: "Lawrence Caltrain, 4.0 miles, ~12-15 min drive",
      greenSpace: "20 nearby parks; closest major park is Ortega Park (2.7 mi); closest pocket park is John Mise Park(0.4 mi)"
    },
    matchInsights: [
      "Ideal for families prioritizing top-ranked Cupertino-area schools",
      "Low environmental and geological risk compared to many Bay Area neighborhoods",
      "Balanced lifestyle with suburban calm and practical commute access"
    ],
    analysis: {
      nature: "Access to multiple city parks and recreational spaces, though not directly adjacent to open preserves",
      commute: "entrally positioned for Cupertino, Santa Clara, and North San Jose tech corridors",
      safety: "Above-average crime ratings with stable neighborhood patterns",
      schools: "Dense cluster of well-rated K–12 options within a 1-mile radius"
    }
  },
  {
    id: "5",
    title: "West San Jose Home in Lynbrook School Zone",
    price: "$2,499,888",
    address: "5733 Harder St, San Jose, CA 95129",
    description: "Compact West San Jose home offering top-tier Cupertino-area schools, low environmental risk, and strong long-term location value.",
    imageUrl: "https://ssl.cdn-redfin.com/photo/8/bigphoto/114/ML82030114_3.jpg",
    additionalImages: [
  "https://ssl.cdn-redfin.com/photo/8/bigphoto/114/ML82030114_9_3.jpg",
  "https://ssl.cdn-redfin.com/photo/8/mbpaddedwide/114/genMid.ML82030114_4_3.jpg"

],
    listingUrl: "https://www.redfin.com/CA/San-Jose/5733-Harder-St-95129/home/1709719",
    specs: {
      beds: 3,
      baths: 2,
      sqft: 1128
    },
    insightBullets: {
      style: "Classic California single-family home with efficient use of space",
      vibe: "Quiet, family-oriented West San Jose neighborhood valued for school access and stability",
      risk: "Flood Zone D (outside SFHA, minimal flood risk), Low fire hazard, No nearby earthquake faults or liquefaction zones, No Superfund sites",
      safety: "Crime profile consistent with surrounding West San Jose areas, low through-traffic residential streets",
      financials: "Property tax ~$31.2K/year, HOA $0/month",
      schools: "Lynbrook High School (10/10) ~0.3 miles, part of the highly sought-after Cupertino-area school corridor",
      hospitals: "Kaiser Permanente San Jose (rating 2.9, 1.3 mi), Kaiser Permanente Santa Clara Medical Center (rating 4.4, 1.6 mi), Kaiser Permanente Child & Adolescent Psychiatry (rating 4.4, 1.8 mi)",
      transit: "Lawrence Caltrain Station ~4.0 miles (~12–15 min drive); primarily car-dependent area",
      greenSpace: "Local neighborhood parks nearby; Big Basin Redwoods State Park ~17.3 miles for regional outdoor recreation"
    },
    matchInsights: [
      "Excellent option for buyers prioritizing Lynbrook High and Cupertino-area schools",
      "Location-driven value with strong long-term appreciation potential",
      "Low environmental risk profile compared to many Bay Area neighborhoods"
    ],
    analysis: {
      nature: "Primarily suburban residential setting with access to local parks and larger regional open spaces by car",
      commute: "Convenient driving access to Cupertino, Santa Clara, and central Silicon Valley via I-280",
      safety: "Consistently stable neighborhood conditions typical of West San Jose",
      schools: "Cupertino-area public schools are a major value driver for this location"
    }
  }
];
